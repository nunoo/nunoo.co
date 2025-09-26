package models

import "time"

type Photo struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	FileName     string    `json:"file_name"`
	OriginalURL  string    `json:"original_url"`
	ThumbnailURL string    `json:"thumbnail_url,omitempty"`
	Caption      string    `json:"caption,omitempty"`
	FileSize     int64     `json:"file_size"`
	MimeType     string    `json:"mime_type"`
	Width        int       `json:"width,omitempty"`
	Height       int       `json:"height,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type PhotoFeed struct {
	Photos     []Photo `json:"photos"`
	Page       int     `json:"page"`
	Limit      int     `json:"limit"`
	TotalCount int64   `json:"total_count"`
	HasMore    bool    `json:"has_more"`
}
