package api

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"nunoo.co/backend/api"
	"nunoo.co/backend/config"
	"nunoo.co/backend/models"
)

func TestPhotoUpload(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:        "test-secret",
			RefreshSecret: "test-refresh-secret",
		},
	}

	server := api.NewServerForTesting(cfg)

	// Create test user and get auth token
	user := registerTestUser(t, server)
	token := loginTestUser(t, server, user)

	// Create a minimal test JPEG (more reliable for content type detection)
	testImage := []byte{
		0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, // JPEG header
		0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, // JFIF marker
		0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, // Quantization table
		0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
		0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
		0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
		0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
		0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
		0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
		0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
		0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
		0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
		0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11,
		0x01, 0x03, 0x11, 0x01, 0xFF, 0xC4, 0x00, 0x14,
		0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		0x00, 0x08, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01,
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		0xFF, 0xDA, 0x00, 0x0C, 0x03, 0x01, 0x00, 0x02,
		0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xB2, 0xC0,
		0x07, 0xFF, 0xD9, // End of image
	}

	// Verify the test image has correct MIME type detection
	if mimeType := http.DetectContentType(testImage); mimeType != "image/jpeg" {
		t.Skipf("Test skipped: test image MIME type is %s, not image/jpeg", mimeType)
		return
	}

	// Upload a photo first
	var photoID string

	// Test photo feed first (no multipart)
	t.Run("test photo feed auth", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/photos/feed", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		w := httptest.NewRecorder()
		server.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("photo feed auth failed: expected status 200, got %d: %s", w.Code, w.Body.String())
		} else {
			t.Log("Photo feed auth works!")
		}
	})

	t.Run("upload photo", func(t *testing.T) {
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)

		// Add photo file
		part, err := writer.CreateFormFile("photo", "test.jpg")
		if err != nil {
			t.Fatal(err)
		}
		_, err = part.Write(testImage)
		if err != nil {
			t.Fatal(err)
		}

		// Add caption
		err = writer.WriteField("caption", "Test photo caption")
		if err != nil {
			t.Fatal(err)
		}
		err = writer.Close()
		if err != nil {
			t.Fatal(err)
		}

		req := httptest.NewRequest("POST", "/photos/upload", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+token)

		w := httptest.NewRecorder()
		server.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Errorf("expected status 201, got %d: %s", w.Code, w.Body.String())
		}

		var response map[string]any
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatal(err)
		}

		photo, ok := response["photo"].(map[string]any)
		if !ok {
			t.Fatal("expected photo in response")
		}

		if photo["caption"] != "Test photo caption" {
			t.Errorf("expected caption 'Test photo caption', got %v", photo["caption"])
		}

		photoID = photo["id"].(string)
	})

	// Test get photo feed (should contain the uploaded photo)
	t.Run("get photo feed", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/photos/feed", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		w := httptest.NewRecorder()
		server.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d: %s", w.Code, w.Body.String())
			return
		}

		var feed models.PhotoFeed
		if err := json.Unmarshal(w.Body.Bytes(), &feed); err != nil {
			t.Fatal(err)
		}

		if len(feed.Photos) == 0 {
			t.Error("expected at least one photo in feed")
		}

		if len(feed.Photos) > 0 && feed.Photos[0].ID != photoID {
			t.Errorf("expected photo ID %s, got %s", photoID, feed.Photos[0].ID)
		}
	})

	// Test unauthorized access
	t.Run("unauthorized photo upload", func(t *testing.T) {
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)

		part, err := writer.CreateFormFile("photo", "test.png")
		if err != nil {
			t.Fatal(err)
		}
		_, err = part.Write(testImage)
		if err != nil {
			t.Fatal(err)
		}
		err = writer.Close()
		if err != nil {
			t.Fatal(err)
		}

		req := httptest.NewRequest("POST", "/photos/upload", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		// No Authorization header

		w := httptest.NewRecorder()
		server.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("expected status 401, got %d", w.Code)
		}
	})

	// Test file too large
	t.Run("file too large", func(t *testing.T) {
		largeImage := make([]byte, 21*1024*1024) // 21MB (over 20MB limit)
		copy(largeImage, testImage)

		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)

		part, err := writer.CreateFormFile("photo", "large.jpg")
		if err != nil {
			t.Fatal(err)
		}
		_, err = part.Write(largeImage)
		if err != nil {
			t.Fatal(err)
		}
		err = writer.Close()
		if err != nil {
			t.Fatal(err)
		}

		req := httptest.NewRequest("POST", "/photos/upload", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+token)

		w := httptest.NewRecorder()
		server.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", w.Code)
		}

		if !strings.Contains(w.Body.String(), "file too large") {
			t.Error("expected 'file too large' error message")
		}
	})
}

func registerTestUser(t *testing.T, server http.Handler) *models.User {
	reqBody := `{"email":"test@example.com","password":"testpassword123"}`
	req := httptest.NewRequest("POST", "/auth/register", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	server.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("failed to register user: %d %s", w.Code, w.Body.String())
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}

	userData := response["user"].(map[string]interface{})
	return &models.User{
		ID:    userData["id"].(string),
		Email: userData["email"].(string),
	}
}

func loginTestUser(t *testing.T, server http.Handler, user *models.User) string {
	reqBody := `{"email":"test@example.com","password":"testpassword123"}`
	req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	server.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("failed to login user: %d %s", w.Code, w.Body.String())
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}

	return response["access_token"].(string)
}
