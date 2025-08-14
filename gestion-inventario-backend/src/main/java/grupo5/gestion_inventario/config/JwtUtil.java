// backend/src/main/java/grupo5/gestion_inventario/config/JwtUtil.java
package grupo5.gestion_inventario.config;

import grupo5.gestion_inventario.model.*;
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

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")            // segundos
    private Long expiration;

    @Autowired
    private EmployeeRepository employeeRepo;

    /* ============================================================
     *  EXTRACCIÓN DE CLAIMS
     * ============================================================ */

    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    public Long extractClientId(String token) {
        return getClaimFromToken(token, c -> c.get("clientId", Long.class));
    }

    public Long extractSucursalId(String token) {                      // ← NUEVO
        return getClaimFromToken(token, c -> c.get("sucursalId", Long.class));
    }

    public <T> T getClaimFromToken(String token, Function<Claims, T> extractor) {
        return extractor.apply(getAllClaims(token));
    }

    private Claims getAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secret)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private boolean isTokenExpired(String token) {
        return getExpirationDateFromToken(token).before(new Date());
    }

    /* ============================================================
     *  GENERACIÓN DE TOKENS
     * ============================================================ */

    /** 1) Token para super-admin del panel global */
    public String generateToken(AdminUser admin) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles",    admin.getRoles());
        claims.put("username", admin.getUsername());
        return createToken(claims, admin.getUsername());
    }

    /** 2) Token para empleados (incluye PROPIETARIO) */
    public String generateToken(Employee emp) {

        List<String> roles = emp.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toCollection(ArrayList::new));

        /* El rol ADMINISTRADOR también se expone como ROLE_CLIENT para compatibilidad */
        if (roles.contains("ROLE_ADMINISTRADOR") && !roles.contains("ROLE_CLIENT")) {
            roles.add("ROLE_CLIENT");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles",       roles);
        claims.put("clientId",    emp.getClient().getId());
        claims.put("employeeId",  emp.getId());
        claims.put("employeeName",emp.getName());

        /* Solo los empleados que NO son PROPIETARIO llevan sucursal explícita */
        if (emp.getRole() != EmployeeRole.PROPIETARIO && emp.getSucursal() != null) {
            claims.put("sucursalId", emp.getSucursal().getId());
        }

        return createToken(claims, emp.getUsername());
    }

    /** 3) Token para cliente dueño (flujo heredado; busca PROPIETARIO) */
    public String generateToken(Client client) {

        Employee owner = employeeRepo
                .findByClientIdAndRole(client.getId(), EmployeeRole.PROPIETARIO)
                .orElseThrow(() ->
                        new RuntimeException("Empleado PROPIETARIO no encontrado para el cliente"));

        List<String> roles = owner.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toCollection(ArrayList::new));

        if (!roles.contains("ROLE_CLIENT")) roles.add("ROLE_CLIENT");

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles",       roles);
        claims.put("clientId",    client.getId());
        claims.put("clientName",  client.getName());
        claims.put("employeeId",  owner.getId());
        claims.put("employeeName",owner.getName());
        /* PROPIETARIO → sucursalId = null */

        return createToken(claims, client.getEmail());
    }

    /* ============================================================
     *  FIRMAR Y VALIDAR
     * ============================================================ */
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration * 1000))
                .signWith(SignatureAlgorithm.HS256, secret)
                .compact();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        return getUsernameFromToken(token).equals(userDetails.getUsername())
                && !isTokenExpired(token);
    }

    /* ============================================================
     *  LEGACY — VERSIÓN ANTERIOR (solo clientId, sin sucursalId)
     *  Mantén comentada como referencia mientras completes la migración.
     * ============================================================
     *
     * public String generateToken(Employee employee) {
     *     List<String> rolesList = employee.getAuthorities()
     *             .stream()
     *             .map(GrantedAuthority::getAuthority)
     *             .collect(Collectors.toList());
     *     if (rolesList.contains("ROLE_ADMINISTRADOR")) rolesList.add("ROLE_CLIENT");
     *
     *     Map<String,Object> claims = new HashMap<>();
     *     claims.put("roles",       rolesList);
     *     claims.put("clientId",    employee.getClient().getId());
     *     claims.put("employeeName",employee.getName());
     *     claims.put("employeeId",  employee.getId());
     *     return createToken(claims, employee.getUsername());
     * }
     *
     */
}
