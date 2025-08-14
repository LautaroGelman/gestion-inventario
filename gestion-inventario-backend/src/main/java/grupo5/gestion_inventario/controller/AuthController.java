// backend/src/main/java/grupo5/gestion_inventario/controller/AuthController.java
package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.config.JwtUtil;
import grupo5.gestion_inventario.clientpanel.dto.AuthRequest;
import grupo5.gestion_inventario.clientpanel.dto.AuthResponse;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
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

import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtUtil              jwtUtil;

    @Autowired private EmployeeRepository   employeeRepo;
    @Autowired private ClientRepository     clientRepo;
    @Autowired private SucursalRepository   sucursalRepo;
    @Autowired private AdminUserRepository  adminUserRepo;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest authRequest) throws Exception {

        /* --------------------------------------------------------
         * 1) Autenticación genérica (Spring Security)
         * -------------------------------------------------------- */
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequest.getUsername(),
                        authRequest.getPassword()
                ));
        SecurityContextHolder.getContext().setAuthentication(auth);
        UserDetails userDetails = (UserDetails) auth.getPrincipal();

        /* --------------------------------------------------------
         * 2) Roles del usuario autenticado
         * -------------------------------------------------------- */
        Set<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        String token;
        Long clientId   = null;
        Long employeeId = null;
        Long sucursalId = null;   // ← NUEVO: sucursal activa (null para PROPIETARIO)

        /* --------------------------------------------------------
         * 3) Flujo para EMPLEADOS (incluye PROPIETARIO)
         * -------------------------------------------------------- */
        boolean esEmpleado = roles.stream().anyMatch(r ->
                r.equals("ROLE_PROPIETARIO")      ||
                        r.equals("ROLE_ADMINISTRADOR")    ||
                        r.equals("ROLE_CAJERO")           ||
                        r.equals("ROLE_MULTIFUNCION")     ||
                        r.equals("ROLE_INVENTARIO")       ||
                        r.equals("ROLE_VENTAS_INVENTARIO")
        );

        if (esEmpleado) {

            Employee emp = employeeRepo.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new Exception(
                            "Empleado no encontrado: " + userDetails.getUsername()));

            token      = jwtUtil.generateToken(emp);
            clientId   = emp.getClient().getId();
            employeeId = emp.getId();

            // Solo empleados distintos de PROPIETARIO llevan sucursal en el token
            if (emp.getRole() != EmployeeRole.PROPIETARIO && emp.getSucursal() != null) {
                sucursalId = emp.getSucursal().getId();
            }

            /* --------------------------------------------------------
             * 4) Flujo para CLIENTE dueño (si mantienes ROLE_CLIENT)
             *    (opcional – puedes eliminarlo cuando migres por completo
             *     a PROPIETARIO como único punto de acceso del cliente)
             * -------------------------------------------------------- */
        } else if (roles.contains("ROLE_CLIENT")) {

            Client client = clientRepo.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new Exception(
                            "Cliente no encontrado: " + userDetails.getUsername()));

            // buscamos PROPIETARIO recién creado
            Employee owner = employeeRepo
                    .findByClientIdAndRole(client.getId(), EmployeeRole.PROPIETARIO)
                    .orElseThrow(() -> new Exception(
                            "Empleado PROPIETARIO no encontrado para el cliente"));

            token      = jwtUtil.generateToken(owner);
            clientId   = client.getId();
            employeeId = owner.getId();
            // sucursalId = null  (propietario ve todas)

            /* --------------------------------------------------------
             * 5) Flujo para usuarios del SUPERPANEL (AdminUser)
             * -------------------------------------------------------- */
        } else {

            AdminUser admin = adminUserRepo.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new Exception(
                            "Admin no encontrado: " + userDetails.getUsername()));

            token = jwtUtil.generateToken(admin);
            // clientId / employeeId / sucursalId se quedan null
        }

        /* --------------------------------------------------------
         * 6) Respuesta
         * -------------------------------------------------------- */
        AuthResponse resp = new AuthResponse();
        resp.setToken(token);
        resp.setClientId(clientId);
        resp.setEmployeeId(employeeId);
        resp.setSucursalId(sucursalId); // ← NUEVO
        resp.setRoles(roles);

        return ResponseEntity.ok(resp);
    }
}

/* ============================================================
 *  LEGACY (ANTES DEL CAMBIO A MULTI-SUCURSAL)
 *  El bloque siguiente mostraba la lógica original basada solo
 *  en clientId. Queda comentado para referencia y se eliminará
 *  una vez terminada la migración.
 * ============================================================
 *
 *  if (roles.stream().anyMatch(r ->
 *          r.equals("ROLE_ADMINISTRADOR") ||
 *          r.equals("ROLE_CAJERO")        ||
 *          r.equals("ROLE_MULTIFUNCION")  ||
 *          r.equals("ROLE_INVENTARIO")    ||
 *          r.equals("ROLE_VENTAS_INVENTARIO"))) {
 *
 *      // empleado sin campo sucursalId
 *      ...
 *  } else if (roles.contains("ROLE_CLIENT")) {
 *      // cliente dueño — generaba token con empleado ADMINISTRADOR
 *      ...
 *  }
 */
