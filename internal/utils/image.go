package utils

import (
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/disintegration/imaging"
)

const (
	MaxFileSize    = 5 * 1024 * 1024 // 5MB
	MaxImages      = 3
	ThumbnailSize  = 200
	ResizedWidth   = 800
	UploadsDir     = "uploads"
)

func ValidateImageFile(file *multipart.FileHeader) error {
	// Check file size
	if file.Size > MaxFileSize {
		return fmt.Errorf("file size exceeds 5MB limit")
	}

	// Check file extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		return fmt.Errorf("only jpg, jpeg, and png files are allowed")
	}

	return nil
}

func SaveImage(file *multipart.FileHeader) (string, error) {
	// Validate file
	if err := ValidateImageFile(file); err != nil {
		return "", err
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	// Decode image
	img, format, err := image.Decode(src)
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	// Generate unique filename
	filename := generateFilename(file.Filename, format)
	filePath := filepath.Join(UploadsDir, filename)

	// Resize image to max width 800px
	resized := imaging.Resize(img, ResizedWidth, 0, imaging.Lanczos)

	// Save resized image
	if err := saveImageFile(resized, filePath, format); err != nil {
		return "", fmt.Errorf("failed to save image: %w", err)
	}

	// Generate thumbnail
	thumbnail := imaging.Thumbnail(img, ThumbnailSize, ThumbnailSize, imaging.Lanczos)
	thumbPath := filepath.Join(UploadsDir, "thumb_"+filename)
	if err := saveImageFile(thumbnail, thumbPath, format); err != nil {
		// Log error but don't fail
	}

	return "/" + filePath, nil
}

func generateFilename(originalName, format string) string {
	timestamp := time.Now().Unix()
	ext := strings.ToLower(filepath.Ext(originalName))
	if ext == "" {
		if format == "jpeg" {
			ext = ".jpg"
		} else {
			ext = "." + format
		}
	}
	return fmt.Sprintf("%d%s", timestamp, ext)
}

func saveImageFile(img image.Image, filePath, format string) error {
	// Create directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
		return err
	}

	// Create file
	out, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer out.Close()

	// Encode image
	switch format {
	case "jpeg", "jpg":
		return jpeg.Encode(out, img, &jpeg.Options{Quality: 85})
	case "png":
		return png.Encode(out, img)
	default:
		return fmt.Errorf("unsupported image format: %s", format)
	}
}

func SaveMultipleImages(files []*multipart.FileHeader) ([]string, error) {
	if len(files) > MaxImages {
		return nil, fmt.Errorf("maximum %d images allowed", MaxImages)
	}

	var urls []string
	for _, file := range files {
		url, err := SaveImage(file)
		if err != nil {
			return nil, err
		}
		urls = append(urls, url)
	}

	return urls, nil
}

func DeleteImage(url string) error {
	if url == "" {
		return nil
	}

	// Remove leading slash if present
	if strings.HasPrefix(url, "/") {
		url = url[1:]
	}

	// Delete main image
	if err := os.Remove(url); err != nil && !os.IsNotExist(err) {
		return err
	}

	// Delete thumbnail
	dir := filepath.Dir(url)
	filename := filepath.Base(url)
	thumbPath := filepath.Join(dir, "thumb_"+filename)
	if err := os.Remove(thumbPath); err != nil && !os.IsNotExist(err) {
		// Ignore thumbnail deletion errors
	}

	return nil
}

func CopyFile(src multipart.File, dstPath string) error {
	dst, err := os.Create(dstPath)
	if err != nil {
		return err
	}
	defer dst.Close()

	_, err = io.Copy(dst, src)
	return err
}
