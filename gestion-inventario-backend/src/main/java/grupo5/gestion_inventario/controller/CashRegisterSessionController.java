// backend/src/main/java/grupo5/gestion_inventario/controller/CashRegisterSessionController.java
package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.clientpanel.dto.CloseSessionRequest;
import grupo5.gestion_inventario.clientpanel.dto.OpenSessionRequest;
import grupo5.gestion_inventario.clientpanel.model.CashRegisterSession;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.service.CashRegisterSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(
        "/api/client-panel/{clientId}/sucursales/{sucursalId}/cash-sessions")
@PreAuthorize(
        "hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','VENTAS_INVENTARIO','MULTIFUNCION')")
public class CashRegisterSessionController {

    private final CashRegisterSessionService sessionService;
    private final EmployeeRepository          employeeRepo;
    private final SucursalRepository          sucursalRepo;

    public CashRegisterSessionController(CashRegisterSessionService sessionService,
                                         EmployeeRepository          employeeRepo,
                                         SucursalRepository          sucursalRepo) {
        this.sessionService = sessionService;
        this.employeeRepo   = employeeRepo;
        this.sucursalRepo   = sucursalRepo;
    }

    /* --------------------------------------------------------
     *  Helper de validación
     * -------------------------------------------------------- */
    private Sucursal validateAccess(Long clientId,
                                    Long sucursalId,
                                    Authentication auth) {

        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        if (!emp.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("Cliente no permitido");
        }

        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() -> new AccessDeniedException("Sucursal no encontrada"));

        if (!sucursal.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("La sucursal no pertenece al cliente");
        }

        boolean esPropietario = emp.getRole() == EmployeeRole.PROPIETARIO;

        if (!esPropietario) {
            if (emp.getSucursal() == null ||
                    !emp.getSucursal().getId().equals(sucursalId)) {
                throw new AccessDeniedException("Sucursal no autorizada");
            }
        }
        return sucursal;
    }

    /* --------------------------------------------------------
     *  Obtener sesión abierta (puede devolver 204 NO CONTENT)
     * -------------------------------------------------------- */
    @GetMapping("/current")
    public ResponseEntity<CashRegisterSession> getCurrentSession(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            Authentication   authentication) {

        validateAccess(clientId, sucursalId, authentication);

        return sessionService.getCurrentSession(authentication.getName(), sucursalId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /* --------------------------------------------------------
     *  Abrir caja
     * -------------------------------------------------------- */
    @PostMapping("/open")
    public ResponseEntity<CashRegisterSession> openSession(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestBody   OpenSessionRequest request,
            Authentication authentication) {

        validateAccess(clientId, sucursalId, authentication);

        CashRegisterSession session =
                sessionService.openSession(request,
                        authentication.getName(),
                        sucursalId);

        return ResponseEntity.ok(session);
    }

    /* --------------------------------------------------------
     *  Cerrar caja
     * -------------------------------------------------------- */
    @PostMapping("/close")
    public ResponseEntity<CashRegisterSession> closeSession(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestBody   CloseSessionRequest request,
            Authentication authentication) {

        validateAccess(clientId, sucursalId, authentication);

        CashRegisterSession session =
                sessionService.closeSession(request,
                        authentication.getName(),
                        sucursalId);

        return ResponseEntity.ok(session);
    }
}
