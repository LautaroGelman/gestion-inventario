// src/main/java/grupo5/gestion_inventario/clientpanel/controller/ClientSaleReturnController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.SaleReturnRequest;
import grupo5.gestion_inventario.clientpanel.dto.SaleReturnDto;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.service.SaleReturnService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/sucursales/{sucursalId}/returns")
public class ClientSaleReturnController {

    private final SaleReturnService  returnService;
    private final EmployeeRepository employeeRepo;
    private final SucursalRepository sucursalRepo;

    public ClientSaleReturnController(SaleReturnService returnService,
                                      EmployeeRepository employeeRepo,
                                      SucursalRepository sucursalRepo) {
        this.returnService = returnService;
        this.employeeRepo  = employeeRepo;
        this.sucursalRepo  = sucursalRepo;
    }

    /* ───────────── validación de acceso (mismo patrón que Products) ───────────── */
    private Sucursal validateAccess(Long clientId, Long sucursalId, Authentication auth) {
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        Client client = emp.getClient();
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }

        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() -> new AccessDeniedException("Sucursal no encontrada"));

        if (!sucursal.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("La sucursal no pertenece al cliente");
        }

        boolean esPropietario = emp.getRole() == EmployeeRole.PROPIETARIO;
        if (!esPropietario) {
            if (emp.getSucursal() == null || !emp.getSucursal().getId().equals(sucursalId)) {
                throw new AccessDeniedException("No autorizado para esta sucursal");
            }
        }
        return sucursal;
    }

    /* ───────────── POST /returns ───────────── */
    @PostMapping
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','VENTAS_INVENTARIO','MULTIFUNCION')")
    public ResponseEntity<SaleReturnDto> createReturn(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestBody SaleReturnRequest req,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);

        // Tu DTO ya tiene sucursalId → lo seteamos directo
        req.setSucursalId(sucursalId);

        // Si tu servicio ya fue migrado a multi-sucursal vía el DTO, queda así:
        SaleReturnDto dto = returnService.createSaleReturn(req);

        // Si en tu proyecto la firma es createSaleReturn(clientId, sucursalId, req),
        // podrías usar esa en su lugar. Elige la que tengas implementada.
        return ResponseEntity.ok(dto);
    }

    /* ───────────── GET /returns ───────────── */
    @GetMapping
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','VENTAS_INVENTARIO','MULTIFUNCION')")
    public ResponseEntity<List<SaleReturnDto>> listReturns(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestParam(required = false) Long saleId,
            @RequestParam(required = false) String from,   // yyyy-MM-dd
            @RequestParam(required = false) String to,     // yyyy-MM-dd
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);

        LocalDateTime fromDt = null, toDt = null;
        try {
            if (from != null && !from.isBlank()) fromDt = LocalDate.parse(from).atStartOfDay();
            if (to != null && !to.isBlank())     toDt   = LocalDate.parse(to).atTime(23, 59, 59);
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Formato de fecha inválido (yyyy-MM-dd)");
        }

        // Firma sugerida (multi-sucursal):
        List<SaleReturnDto> list = returnService.listReturns(sucursalId, saleId, fromDt, toDt);

        // Si aún usas la firma antigua sin sucursalId:
        // List<SaleReturnDto> list = returnService.listReturns(clientId, saleId, fromDt, toDt);

        return ResponseEntity.ok(list);
    }
}
