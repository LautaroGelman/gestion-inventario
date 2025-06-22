package grupo5.gestion_inventario.config;

import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.superpanel.model.AdminUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
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

    @Autowired
    private EmployeeRepository employeeRepository;

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
        return Jwts.parserBuilder()
                .setSigningKey(secret)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    // --- MÉTODOS PARA GENERAR TOKENS ---

    // 1) Token para superadmin
    public String generateToken(AdminUser admin) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", admin.getRoles());
        claims.put("username", admin.getUsername());
        return createToken(claims, admin.getUsername());
    }

    // 2) Token para empleados (cajeros, multifunción)
    public String generateToken(Employee employee) {
        List<String> rolesList = employee.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        // Si es administrador, habilitar también como cliente
        if (rolesList.contains("ROLE_ADMINISTRADOR")) {
            rolesList.add("ROLE_CLIENT");
        }
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", rolesList);
        claims.put("clientId", employee.getClient().getId());
        claims.put("employeeName", employee.getName());
        claims.put("employeeId", employee.getId());
        return createToken(claims, employee.getUsername());
    }

    // 3) Token para cliente (dueño)
    public String generateToken(Client client) {
        // Buscar su empleado ADMINISTRADOR
        Employee ownerEmp = employeeRepository
                .findByClientIdAndRole(client.getId(), EmployeeRole.ADMINISTRADOR)
                .orElseThrow(() -> new RuntimeException("Empleado ADMINISTRADOR no encontrado para el cliente"));
        // Recopilar roles del empleado y añadir ROLE_CLIENT
        List<String> rolesList = ownerEmp.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toCollection(ArrayList::new));
        if (!rolesList.contains("ROLE_CLIENT")) {
            rolesList.add("ROLE_CLIENT");
        }
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", rolesList);
        claims.put("clientId", client.getId());
        claims.put("clientName", client.getName());
        claims.put("employeeId", ownerEmp.getId());
        claims.put("employeeName", ownerEmp.getName());
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
