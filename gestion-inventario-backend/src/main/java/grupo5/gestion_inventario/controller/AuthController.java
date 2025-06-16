package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.config.JwtUtil;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.clientpanel.dto.AuthRequest;
import grupo5.gestion_inventario.clientpanel.dto.AuthResponse;
import grupo5.gestion_inventario.superpanel.model.AdminUser;
import grupo5.gestion_inventario.superpanel.repository.AdminUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    // Inyectamos todos los repositorios de usuarios
    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private ClientRepository clientRepository;

    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthRequest authRequest) throws Exception {
        // 1. Autenticación genérica
        final Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        final UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        final String jwt;

        // 2. Lógica de diferenciación por roles
        Set<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        if (roles.contains("ROLE_ADMINISTRADOR") || roles.contains("ROLE_CAJERO") || roles.contains("ROLE_MULTIFUNCION")) {
            // Es un Empleado
            Employee employee = employeeRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new Exception("Empleado no encontrado: " + userDetails.getUsername()));
            jwt = jwtUtil.generateToken(employee);

        } else if (roles.contains("ROLE_CLIENT")) {
            // Es un Cliente
            Client client = clientRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new Exception("Cliente no encontrado: " + userDetails.getUsername()));
            jwt = jwtUtil.generateToken(client);

        } else {
            // Por defecto, es un AdminUser
            AdminUser admin = adminUserRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new Exception("Admin no encontrado: " + userDetails.getUsername()));
            jwt = jwtUtil.generateToken(admin);
        }

        // 3. Devolvemos el token generado
        return ResponseEntity.ok(new AuthResponse(jwt));
    }
}