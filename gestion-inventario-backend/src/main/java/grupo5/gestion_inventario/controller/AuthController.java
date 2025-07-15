package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.config.JwtUtil;
import grupo5.gestion_inventario.clientpanel.dto.AuthRequest;
import grupo5.gestion_inventario.clientpanel.dto.AuthResponse;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.superpanel.model.AdminUser;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.EmployeeRepository;
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

import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private ClientRepository clientRepository;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> createAuthenticationToken(
            @RequestBody AuthRequest authRequest) throws Exception {

        // 1. Autenticación genérica
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequest.getUsername(),
                        authRequest.getPassword()
                )
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // 2. Recopilar roles
        Set<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        String token;
        Long clientId = null;
        Long employeeId = null;

        // Ahora incluimos los nuevos roles de empleado
        if (roles.stream().anyMatch(r ->
                r.equals("ROLE_ADMINISTRADOR") ||
                        r.equals("ROLE_CAJERO") ||
                        r.equals("ROLE_MULTIFUNCION") ||
                        r.equals("ROLE_INVENTARIO") ||
                        r.equals("ROLE_VENTAS_INVENTARIO")
        )) {
            // Usuario es un Employee
            Employee employee = employeeRepository
                    .findByEmail(userDetails.getUsername())
                    .orElseThrow(() ->
                            new Exception("Empleado no encontrado: " + userDetails.getUsername())
                    );
            token = jwtUtil.generateToken(employee);
            clientId = employee.getClient().getId();
            employeeId = employee.getId();

        } else if (roles.contains("ROLE_CLIENT")) {
            // Usuario es un Cliente (dueño)
            Client client = clientRepository
                    .findByEmail(userDetails.getUsername())
                    .orElseThrow(() ->
                            new Exception("Cliente no encontrado: " + userDetails.getUsername())
                    );

            Employee ownerEmp = employeeRepository
                    .findByClientIdAndRole(client.getId(), EmployeeRole.ADMINISTRADOR)
                    .orElseThrow(() ->
                            new Exception("Empleado ADMINISTRADOR no encontrado para el cliente")
                    );
            token = jwtUtil.generateToken(ownerEmp);
            clientId = client.getId();
            employeeId = ownerEmp.getId();

        } else {
            // Usuario es un AdminUser del superpanel
            AdminUser admin = adminUserRepository
                    .findByUsername(userDetails.getUsername())
                    .orElseThrow(() ->
                            new Exception("Admin no encontrado: " + userDetails.getUsername())
                    );
            token = jwtUtil.generateToken(admin);
            // superadmin no usa clientId/employeeId
        }

        // 3. Responder con token y datos
        AuthResponse resp = new AuthResponse();
        resp.setToken(token);
        resp.setClientId(clientId);
        resp.setEmployeeId(employeeId);
        resp.setRoles(roles);

        return ResponseEntity.ok(resp);
    }
}