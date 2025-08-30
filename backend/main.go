package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"nunoo.co/backend/api"
	"nunoo.co/backend/config"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("failed to load config", zap.Error(err))
	}

	port := cfg.Server.Port
	if port == "" {
		port = "8080"
	}

	h := api.NewServer(cfg)

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      h,
		ReadTimeout:  durationOrDefault(cfg.Server.ReadTimeout, 15*time.Second),
		WriteTimeout: durationOrDefault(cfg.Server.WriteTimeout, 15*time.Second),
		IdleTimeout:  durationOrDefault(cfg.Server.IdleTimeout, 60*time.Second),
	}

	serverCtx, serverStopCtx := context.WithCancel(context.Background())

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	go func() {
		<-sig

		shutdownCtx, _ := context.WithTimeout(serverCtx, 30*time.Second)
		go func() {
			<-shutdownCtx.Done()
			if shutdownCtx.Err() == context.DeadlineExceeded {
				logger.Fatal("graceful shutdown timed out.. forcing exit.")
			}
		}()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			logger.Fatal("server shutdown error", zap.Error(err))
		}
		serverStopCtx()
	}()

	logger.Info("starting server", zap.String("port", port))
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatal("server error", zap.Error(err))
	}

	<-serverCtx.Done()
}

func durationOrDefault(v, def time.Duration) time.Duration {
	if v <= 0 {
		return def
	}
	return v
}
