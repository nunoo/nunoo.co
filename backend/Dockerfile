# syntax=docker/dockerfile:1
# --- Build stage ---
FROM golang:1.25-alpine AS build
WORKDIR /app
RUN apk add --no-cache build-base ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags "-s -w" -o /out/app ./main.go

# --- Run stage ---
FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /
COPY --from=build /out/app /app
COPY --from=build /app/config /config
COPY --from=build /app/migrations /migrations
ENV PORT=8080
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app"]
