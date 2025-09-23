package handlers

import (
	"bufio"
	"bytes"
	"strings"
)

func ValidateImageFile(file []byte) error {
	reader := bytes.NewReader(file)
	scanner := bufio.NewScanner(reader)
	
	// Read first few bytes to check for executable headers
	if len(file) < 10 {
		return ErrInvalidImageFile
	}

	// Check for malicious patterns
	firstBytes := file[:10]
	
	// Detect executable file signatures
	executableSignatures := [][]byte{
		{0x4D, 0x5A},                   // PE executable (MZ)
		{0x7F, 0x45, 0x4C, 0x46},       // ELF executable
		{0xFE, 0xED, 0xFA, 0xCE},       // Mach-O executable (32-bit)
		{0xFE, 0xED, 0xFA, 0xCF},       // Mach-O executable (64-bit)
		{0xCA, 0xFE, 0xBA, 0xBE},       // Java class file
		{0x50, 0x4B, 0x03, 0x04},       // ZIP file (could contain executable)
	}

	for _, sig := range executableSignatures {
		if bytes.HasPrefix(firstBytes, sig) {
			return ErrMaliciousFile
		}
	}

	// Check for script patterns
	if scanner.Scan() {
		firstLine := strings.ToLower(strings.TrimSpace(scanner.Text()))
		scriptPatterns := []string{
			"#!",
			"<script",
			"<?php",
			"#!/bin/",
			"#!/usr/bin/",
		}
		
		for _, pattern := range scriptPatterns {
			if strings.HasPrefix(firstLine, pattern) {
				return ErrMaliciousFile
			}
		}
	}

	return nil
}

var (
	ErrInvalidImageFile = &ValidationError{Message: "invalid image file format"}
	ErrMaliciousFile    = &ValidationError{Message: "potentially malicious file detected"}
)

type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}