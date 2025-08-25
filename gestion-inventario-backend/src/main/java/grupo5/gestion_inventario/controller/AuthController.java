// backend/src/main/java/grupo5/gestion_inventario/controller/AuthController.java
package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.clientpanel.dto.AuthRequest;
import grupo5.gestion_inventario.clientpanel.dto.AuthResponse;
import grupo5.gestion_inventario.config.JwtUtil;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.superpanel.model.AdminUser;
import grupo5.gestion_inventario.superpanel.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * AuthController
 * - /api/auth/login: autentica y devuelve AuthResponse con token, clientId, employeeId, sucursalId (si aplica) y roles.
 * - /api/auth/me:    devuelve los mismos metadatos (sin token), útil para restaurar sesión en el front.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil               jwtUtil;

    private final EmployeeRepository    employeeRepo;
    private final ClientRepository      clientRepo;
    private final AdminUserRepository   adminUserRepo;

    /* ============================
     * POST /api/auth/login
     * ============================ */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest authRequest) {

        // 1) Autenticar con Spring Security
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequest.getUsername(),
                        authRequest.getPassword()
                )
        );

        UserDetails userDetails = (UserDetails) auth.getPrincipal();

        // 2) Roles del usuario autenticado
        Set<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority) // p.ej. ROLE_CAJERO
                .collect(Collectors.toSet());

        String username = userDetails.getUsername();
        String token;
        Long clientId   = null;
        Long employeeId = null;
        Long sucursalId = null; // null para propietarios/sin sucursal

        // 3) Flujo empleado (incluye PROPIETARIO/ADMINISTRADOR/CAJERO/etc.)
        Employee emp = employeeRepo.findByEmail(username).orElse(null);
        if (emp != null) {
            clientId   = emp.getClient() != null ? emp.getClient().getId() : null;
            employeeId = emp.getId();

            // sucursalId solo si NO es propietario y tiene sucursal asignada
            if (emp.getRole() != EmployeeRole.PROPIETARIO && emp.getSucursal() != null) {
                sucursalId = emp.getSucursal().getId();
            }

            token = jwtUtil.generateToken(emp);
        }
        // 4) Flujo cliente dueño (compatibilidad si seguís soportando ROLE_CLIENT)
        else if (roles.contains("ROLE_CLIENT")) {
            Client client = clientRepo.findByEmail(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente no encontrado"));

            // Buscar el empleado PROPIETARIO del cliente para firmar el token
            Employee owner = employeeRepo
                    .findByClientIdAndRole(client.getId(), EmployeeRole.PROPIETARIO)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Propietario no encontrado para el cliente"));

            clientId   = client.getId();
            employeeId = owner.getId();
            // sucursalId = null (propietario ve todas)
            token = jwtUtil.generateToken(owner);
        }
        // 5) Flujo superpanel (admin)
        else {
            AdminUser admin = adminUserRepo.findByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin no encontrado"));
            token = jwtUtil.generateToken(admin);
            // clientId/employeeId/sucursalId quedan null
        }

        // 6) Respuesta
        AuthResponse resp = new AuthResponse(token, clientId, employeeId, sucursalId, roles);
        return ResponseEntity.ok(resp);
    }

    /* ============================
     * GET /api/auth/me
     * (Sin token; útil para restaurar sesión en front)
     * ============================ */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }

        Set<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        String username = principal.getUsername();
        Long clientId   = null;
        Long employeeId = null;
        Long sucursalId = null;

        Employee emp = employeeRepo.findByEmail(username).orElse(null);
        if (emp != null) {
            clientId   = emp.getClient() != null ? emp.getClient().getId() : null;
            employeeId = emp.getId();
            if (emp.getRole() != EmployeeRole.PROPIETARIO && emp.getSucursal() != null) {
                sucursalId = emp.getSucursal().getId();
            }
        } else if (roles.contains("ROLE_CLIENT")) {
            Client client = clientRepo.findByEmail(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente no encontrado"));
            // Buscar propietario para informar employeeId (opcional)
            Employee owner = employeeRepo
                    .findByClientIdAndRole(client.getId(), EmployeeRole.PROPIETARIO)
                    .orElse(null);
            clientId   = client.getId();
            employeeId = owner != null ? owner.getId() : null;
        } else {
            // Superpanel: nada que completar (queda todo null)
        }

        // token = null en /me
        AuthResponse resp = new AuthResponse(null, clientId, employeeId, sucursalId, roles);
        return ResponseEntity.ok(resp);
    }
}
