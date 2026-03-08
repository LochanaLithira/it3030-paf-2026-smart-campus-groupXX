package com.smartcampus.backend.security;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.*;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Provides JWT token generation and validation using RS256 (RSA + SHA-256).
 * <p>
 * In development / CI an ephemeral RSA key-pair is auto-generated at startup.
 * In production, supply {@code app.jwt.private-key} and {@code app.jwt.public-key}
 * as Base64-encoded PEM strings (PKCS#8 private key + X.509 public key).
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private static final String TOKEN_TYPE_ACCESS  = "ACCESS";
    private static final String TOKEN_TYPE_REFRESH = "REFRESH";

    @Value("${app.jwt.private-key:}")
    private String privateKeyBase64;

    @Value("${app.jwt.public-key:}")
    private String publicKeyBase64;

    @Value("${app.jwt.access-token-expiry-seconds:900}")
    private long accessTokenExpirySeconds;

    @Value("${app.jwt.refresh-token-expiry-seconds:604800}")
    private long refreshTokenExpirySeconds;

    @Value("${app.jwt.issuer:smart-campus}")
    private String issuer;

    private RSAKey rsaKey;

    @PostConstruct
    public void init() throws Exception {
        if (privateKeyBase64 != null && !privateKeyBase64.isBlank()) {
            log.info("Loading RSA key pair from configuration");
            rsaKey = loadRsaKeyFromPem(privateKeyBase64, publicKeyBase64);
        } else {
            log.warn("No RSA key configured – generating ephemeral key pair (DEV only!)");
            rsaKey = new RSAKeyGenerator(2048)
                    .keyIDFromThumbprint(true)
                    .generate();
        }
    }

    // ───────────────────── Token Generation ─────────────────────

    public String generateAccessToken(UserPrincipal principal) {
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .subject(principal.getUserId().toString())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(accessTokenExpirySeconds)))
                .jwtID(UUID.randomUUID().toString())
                .claim("email", principal.getEmail())
                .claim("name", principal.getFullName())
                .claim("roles", principal.getRoles())
                .claim("permissions", principal.getPermissions())
                .claim("typ", TOKEN_TYPE_ACCESS)
                .build();
        return sign(claims);
    }

    public String generateRefreshToken(UUID userId) {
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .subject(userId.toString())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(refreshTokenExpirySeconds)))
                .jwtID(UUID.randomUUID().toString())
                .claim("typ", TOKEN_TYPE_REFRESH)
                .build();
        return sign(claims);
    }

    // ───────────────────── Token Validation ─────────────────────

    public boolean validateToken(String token) {
        try {
            JWTClaimsSet claims = parseClaims(token);
            return !claims.getExpirationTime().toInstant().isBefore(Instant.now());
        } catch (Exception e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean isRefreshToken(String token) {
        try {
            return TOKEN_TYPE_REFRESH.equals(parseClaims(token).getStringClaim("typ"));
        } catch (Exception e) {
            return false;
        }
    }

    public UUID getUserId(String token) {
        try {
            return UUID.fromString(parseClaims(token).getSubject());
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot extract user ID from token", e);
        }
    }

    public String getJti(String token) {
        try {
            return parseClaims(token).getJWTID();
        } catch (Exception e) {
            return null;
        }
    }

    public long getAccessTokenExpirySeconds() { return accessTokenExpirySeconds; }

    // ───────────────────── Internals ─────────────────────

    private String sign(JWTClaimsSet claims) {
        try {
            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                    .keyID(rsaKey.getKeyID())
                    .type(JOSEObjectType.JWT)
                    .build();
            SignedJWT jwt = new SignedJWT(header, claims);
            jwt.sign(new RSASSASigner(rsaKey));
            return jwt.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Failed to sign JWT", e);
        }
    }

    private JWTClaimsSet parseClaims(String token) throws ParseException, JOSEException {
        SignedJWT jwt = SignedJWT.parse(token);
        RSASSAVerifier verifier = new RSASSAVerifier(rsaKey.toRSAPublicKey());
        if (!jwt.verify(verifier)) {
            throw new JOSEException("JWT signature verification failed");
        }
        return jwt.getJWTClaimsSet();
    }

    private RSAKey loadRsaKeyFromPem(String privateKeyB64, String publicKeyB64) throws Exception {
        byte[] privateKeyBytes = Base64.getDecoder().decode(privateKeyB64.trim());
        byte[] publicKeyBytes  = Base64.getDecoder().decode(publicKeyB64.trim());
        // Use nimbus JWK parsing (returns JWK, cast to RSAKey)
        return (RSAKey) RSAKey.parseFromPEMEncodedObjects(
                new String(privateKeyBytes, StandardCharsets.UTF_8)
        );
    }
}
