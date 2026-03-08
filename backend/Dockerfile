# =============================================
#  Smart Campus Backend — Multi-stage Dockerfile
# =============================================

# ── Stage 1: Build ─────────────────────────────
FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /build

# Copy Maven wrapper and pom first (layer cache for dependencies)
COPY mvnw pom.xml ./
COPY .mvn .mvn

# Download dependencies (cached when pom.xml hasn't changed)
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B -q

# Copy source and build
COPY src ./src
RUN ./mvnw package -B -DskipTests -q

# ── Stage 2: Extract layers ────────────────────
FROM eclipse-temurin:21-jre-jammy AS extractor

WORKDIR /build

COPY --from=builder /build/target/*.jar app.jar

RUN java -Djarmode=layertools -jar app.jar extract --destination extracted

# ── Stage 3: Runtime ───────────────────────────
FROM eclipse-temurin:21-jre-jammy AS runtime

# Create a non-root user for security
RUN groupadd --system appgroup && \
    useradd --system --gid appgroup --shell /bin/false appuser

WORKDIR /app

# Copy application layers (ordering matters for cache efficiency: dependencies first)
COPY --from=extractor /build/extracted/dependencies          ./
COPY --from=extractor /build/extracted/spring-boot-loader   ./
COPY --from=extractor /build/extracted/snapshot-dependencies ./
COPY --from=extractor /build/extracted/application          ./

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/actuator/health || exit 1

# Start the application using the exploded jar loader (faster startup)
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "org.springframework.boot.loader.launch.JarLauncher"]
