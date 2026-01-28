# Multi-stage build for smaller image size

# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Explicitly set Java version
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Install Maven
RUN apk add --no-cache maven

# Verify Java version
RUN java -version && javac -version

# Copy pom.xml first for dependency caching
COPY pom.xml ./

# Download dependencies (cached if pom.xml doesn't change)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application with tests
RUN mvn clean package -B

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Explicitly set Java version
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Verify Java version
RUN java -version

# Create uploads directory
RUN mkdir -p /app/uploads

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run the application with aggressive memory optimization
# -Xmx384m: Maximum heap size 384MB (reduced from 512MB)
# -Xms192m: Initial heap size 192MB (reduced from 256MB)
# -XX:MaxMetaspaceSize=96m: Limit metaspace to 96MB (reduced from 128MB)
# -XX:+UseG1GC: Use G1 garbage collector (better for low memory)
# -XX:MaxGCPauseMillis=200: Target max GC pause time
# -XX:+UseContainerSupport: Respect container memory limits
# -XX:MaxRAMPercentage=70.0: Use max 70% of container memory (reduced from 75%)
# -XX:+ExitOnOutOfMemoryError: Exit immediately on OOM
# -XX:+HeapDumpOnOutOfMemoryError: Generate heap dump on OOM (for debugging)
# -XX:HeapDumpPath=/tmp/heapdump.hprof: Heap dump location
# -Dspring.jmx.enabled=false: Disable JMX to save memory
# -Dspring.backgroundpreinitializer.ignore=true: Skip background pre-initialization
ENTRYPOINT ["java", \
    "-Xmx384m", \
    "-Xms192m", \
    "-XX:MaxMetaspaceSize=96m", \
    "-XX:+UseG1GC", \
    "-XX:MaxGCPauseMillis=200", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=70.0", \
    "-XX:+ExitOnOutOfMemoryError", \
    "-XX:+HeapDumpOnOutOfMemoryError", \
    "-XX:HeapDumpPath=/tmp/heapdump.hprof", \
    "-Dspring.profiles.active=prod", \
    "-Dspring.jmx.enabled=false", \
    "-Dspring.backgroundpreinitializer.ignore=true", \
    "-jar", "app.jar"]
