package repository

import "strings"

// NormalizeEmail returns a canonical form for user emails for lookup and storage
func NormalizeEmail(e string) string { return strings.ToLower(strings.TrimSpace(e)) }
