package grupo5.gestion_inventario.config;

import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.superpanel.model.AdminUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    public Long extractClientId(String token) {
        return getClaimFromToken(token, claims -> claims.get("clientId", Long.class));
    }

    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(secret).build().parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    // --- MÉTODOS SOBRECARGADOS PARA GENERAR TOKENS ESPECÍFICOS ---

    // Token para AdminUser
    public String generateToken(AdminUser admin) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", admin.getRoles());
        claims.put("username", admin.getUsername());
        return createToken(claims, admin.getUsername());
    }

    // Token para Employee
    public String generateToken(Employee employee) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", employee.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList()));
        claims.put("clientId", employee.getClient().getId());
        claims.put("employeeName", employee.getName());
        return createToken(claims, employee.getUsername()); // getUsername() devuelve el email
    }

    // Token para Client
    public String generateToken(Client client) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", List.of("ROLE_CLIENT"));
        claims.put("clientId", client.getId());
        claims.put("clientName", client.getName());
        return createToken(claims, client.getEmail());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration * 1000))
                .signWith(SignatureAlgorithm.HS256, secret)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = getUsernameFromToken(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}