package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"go.uber.org/zap"
	"nunoo.co/backend/models"
	"nunoo.co/backend/repository"
	"nunoo.co/backend/types"
)

const (
	MaxFileSize  = 20 << 20 // 20MB
	MaxMemory    = 10 << 20 // 10MB for form parsing
	UploadDir    = "./uploads/photos"
	ThumbnailDir = "./uploads/thumbnails"
)

var allowedMimeTypes = map[string]bool{
	"image/jpeg":               true,
	"image/png":                true,
	"image/webp":               true,
	"image/gif":                true,
	"image/heic":               true,
	"image/heif":               true,
	"image/tiff":               true,
	"image/bmp":                true,
	"application/octet-stream": true, // Fallback for content type detection issues
}

type PhotoHandlers struct {
	photos repository.PhotoRepository
	logger *zap.Logger
}

func NewPhotoHandlers(photos repository.PhotoRepository) *PhotoHandlers {
	logger, _ := zap.NewProduction()

	err := os.MkdirAll(UploadDir, 0755)
	if err != nil {
		logger.Error("failed to create upload directory", zap.Error(err))
	}
	err = os.MkdirAll(ThumbnailDir, 0755)
	if err != nil {
		logger.Error("failed to create thumbnail directory", zap.Error(err))
	}

	return &PhotoHandlers{
		photos: photos,
		logger: logger,
	}
}

type UploadPhotoRequest struct {
	Caption string `json:"caption,omitempty"`
}

type UploadPhotoResponse struct {
	Photo *models.Photo `json:"photo"`
}

func (h *PhotoHandlers) UploadPhoto(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(MaxMemory); err != nil {
		writeError(w, http.StatusBadRequest, "failed to parse multipart form")
		return
	}

	file, header, err := r.FormFile("photo")
	if err != nil {
		writeError(w, http.StatusBadRequest, "photo file is required")
		return
	}
	defer func() {
		if err := file.Close(); err != nil {
			fmt.Println("failed to close file", zap.Error(err))
		}
	}()

	if header.Size > MaxFileSize {
		writeError(w, http.StatusBadRequest, "file too large")
		return
	}

	mimeType := header.Header.Get("Content-Type")
	// Fallback to detecting MIME type from file content if not set
	if mimeType == "" {
		// Read a small portion to detect MIME type
		buf := make([]byte, 512)
		n, _ := file.Read(buf)
		mimeType = http.DetectContentType(buf[:n])
		if _, err := file.Seek(0, 0); err != nil {
			fmt.Println("failed to reset file pointer", zap.Error(err))
		}
	}

	if !allowedMimeTypes[mimeType] {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("unsupported file type (jpeg, png, webp, gif only): %s", mimeType))
		return
	}

	// Read file content for security validation
	fileContent := make([]byte, header.Size)
	if _, err := file.Read(fileContent); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to read file")
		return
	}
	if _, err := file.Seek(0, 0); err != nil {
		fmt.Println("failed to reset file pointer", zap.Error(err))
	}

	// Security validation
	if err := ValidateImageFile(fileContent); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	user := getUserFromContext(r)
	if user == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	caption := r.FormValue("caption")
	// Sanitize caption to prevent XSS
	caption = sanitizeInput(caption)

	photo, err := h.savePhoto(file, header, user.ID, caption, mimeType)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to save photo: %v", err))
		return
	}

	if err := h.photos.Create(r.Context(), photo); err != nil {
		h.logger.Error("failed to create photo record",
			zap.Error(err),
			zap.String("user_id", user.ID),
			zap.String("photo_id", photo.ID))

		// Clean up uploaded file on database error
		h.deletePhotoFiles(photo)

		if err == repository.ErrPhotoExists {
			writeError(w, http.StatusConflict, "photo already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to save photo metadata")
		return
	}

	writeJSON(w, http.StatusCreated, UploadPhotoResponse{Photo: photo})
}

func (h *PhotoHandlers) GetPhotoFeed(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 50 {
		limit = 20
	}

	// Public feed - get all photos regardless of user
	photos, totalCount, err := h.photos.GetAll(r.Context(), page, limit)
	if err != nil {
		h.logger.Error("failed to get photos",
			zap.Error(err),
			zap.Int("page", page),
			zap.Int("limit", limit))
		writeError(w, http.StatusInternalServerError, "failed to get photos")
		return
	}

	hasMore := int64(page*limit) < totalCount

	feed := &models.PhotoFeed{
		Photos:     photos,
		Page:       page,
		Limit:      limit,
		TotalCount: totalCount,
		HasMore:    hasMore,
	}

	writeJSON(w, http.StatusOK, feed)
}

func (h *PhotoHandlers) GetPhoto(w http.ResponseWriter, r *http.Request) {
	photoID := r.URL.Query().Get("id")
	if photoID == "" {
		writeError(w, http.StatusBadRequest, "photo id is required")
		return
	}

	photo, err := h.photos.GetByID(r.Context(), photoID)
	if err != nil {
		if err == repository.ErrPhotoNotFound {
			writeError(w, http.StatusNotFound, "photo not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to get photo")
		return
	}

	writeJSON(w, http.StatusOK, map[string]*models.Photo{"photo": photo})
}

func (h *PhotoHandlers) DeletePhoto(w http.ResponseWriter, r *http.Request) {
	photoID := r.URL.Query().Get("id")
	if photoID == "" {
		writeError(w, http.StatusBadRequest, "photo id is required")
		return
	}

	user := getUserFromContext(r)
	if user == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	photo, err := h.photos.GetByID(r.Context(), photoID)
	if err != nil {
		if err == repository.ErrPhotoNotFound {
			writeError(w, http.StatusNotFound, "photo not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to get photo")
		return
	}

	if photo.UserID != user.ID {
		writeError(w, http.StatusForbidden, "cannot delete another user's photo")
		return
	}

	if err := h.photos.Delete(r.Context(), photoID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete photo")
		return
	}

	h.deletePhotoFiles(photo)

	w.WriteHeader(http.StatusNoContent)
}

func (h *PhotoHandlers) savePhoto(file multipart.File, header *multipart.FileHeader, userID, caption, mimeType string) (*models.Photo, error) {
	photoID := newPhotoID()
	ext := getFileExtension(mimeType)
	fileName := fmt.Sprintf("%s%s", photoID, ext)
	filePath := filepath.Join(UploadDir, fileName)

	dst, err := os.Create(filePath)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := dst.Close(); err != nil {
			fmt.Println("failed to close destination file", zap.Error(err))
		}
	}()

	if _, err := io.Copy(dst, file); err != nil {
		return nil, err
	}

	photo := &models.Photo{
		ID:          photoID,
		UserID:      userID,
		FileName:    fileName,
		OriginalURL: fmt.Sprintf("/uploads/photos/%s", fileName),
		Caption:     caption,
		FileSize:    header.Size,
		MimeType:    mimeType,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	return photo, nil
}

func (h *PhotoHandlers) deletePhotoFiles(photo *models.Photo) {
	originalPath := filepath.Join(UploadDir, photo.FileName)
	if err := os.Remove(originalPath); err != nil {
		fmt.Println("failed to remove original file", zap.Error(err))
	}

	if photo.ThumbnailURL != "" {
		thumbnailFileName := strings.TrimPrefix(photo.ThumbnailURL, "/uploads/thumbnails/")
		thumbnailPath := filepath.Join(ThumbnailDir, thumbnailFileName)
		if err := os.Remove(thumbnailPath); err != nil {
			fmt.Println("failed to remove thumbnail file", zap.Error(err))
		}
	}
}

func newPhotoID() string {
	return fmt.Sprintf("photo_%d", time.Now().UnixNano())
}

func getFileExtension(mimeType string) string {
	switch mimeType {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	case "image/gif":
		return ".gif"
	default:
		return ".jpg"
	}
}

func getUserFromContext(r *http.Request) *models.User {
	val := r.Context().Value(types.CtxKey{})
	if user, ok := val.(*models.User); ok {
		return user
	}
	return nil
}

func sanitizeInput(input string) string {
	// Remove potential XSS patterns
	input = strings.ReplaceAll(input, "<", "")
	input = strings.ReplaceAll(input, ">", "")
	input = strings.ReplaceAll(input, "&", "")
	input = strings.ReplaceAll(input, "\"", "")
	input = strings.ReplaceAll(input, "'", "")

	// Limit length
	if len(input) > 500 {
		input = input[:500]
	}

	return strings.TrimSpace(input)
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		fmt.Println("failed to write JSON", zap.Error(err))
	}
}

func writeError(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}
