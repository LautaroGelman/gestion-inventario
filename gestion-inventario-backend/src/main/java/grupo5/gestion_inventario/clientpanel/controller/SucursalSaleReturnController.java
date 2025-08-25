// backend/src/main/java/grupo5/gestion_inventario/clientpanel/controller/SucursalSaleReturnController.java
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/sucursales/{sucursalId}/returns")
@PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','VENTAS_INVENTARIO','MULTIFUNCION')")
public class SucursalSaleReturnController {

    private final SaleReturnService  returnService;
    private final EmployeeRepository employeeRepo;
    private final SucursalRepository sucursalRepo;

    public SucursalSaleReturnController(SaleReturnService returnService,
                                        EmployeeRepository employeeRepo,
                                        SucursalRepository sucursalRepo) {
        this.returnService = returnService;
        this.employeeRepo  = employeeRepo;
        this.sucursalRepo  = sucursalRepo;
    }

    /* --------------------------------------------------------
     *  Validación de acceso (mismo patrón que inventory/sales)
     * -------------------------------------------------------- */
    private Sucursal validateAccess(Long clientId, Long sucursalId, Authentication auth) {
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Empleado no encontrado"));

        Client client = emp.getClient();
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }

        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada"));

        if (!sucursal.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("La sucursal no pertenece al cliente");
        }

        boolean propietario = emp.getRole() == EmployeeRole.PROPIETARIO;
        if (!propietario) {
            if (emp.getSucursal() == null || !emp.getSucursal().getId().equals(sucursalId)) {
                throw new AccessDeniedException("No autorizado para esta sucursal");
            }
        }
        return sucursal;
    }

    /* --------------------------------------------------------
     *  POST /returns  → Crear devolución
     * -------------------------------------------------------- */
    @PostMapping
    public ResponseEntity<SaleReturnDto> createReturn(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestBody SaleReturnRequest req,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);

        // El servicio espera la sucursal en el DTO (según tu implementación actual):
        try {
            req.setSucursalId(sucursalId);
        } catch (Exception ignored) { /* si el DTO no tiene setter, ignora */ }

        // Si tu servicio ya usa únicamente el DTO con sucursalId:
        SaleReturnDto dto = returnService.createSaleReturn(req);

        // Si en tu proyecto tenés una firma distinta (por ej. createSaleReturn(sucursalId, req)),
        // reemplazá la llamada de arriba por esa.
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /* --------------------------------------------------------
     *  GET /returns  → Listar devoluciones por rango/venta
     *  Query params: from=yyyy-MM-dd, to=yyyy-MM-dd, saleId=Long (opcionales)
     * -------------------------------------------------------- */
    @GetMapping
    public ResponseEntity<List<SaleReturnDto>> listReturns(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestParam(required = false) Long saleId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);

        LocalDateTime fromDt = null, toDt = null;
        try {
            if (from != null && !from.isBlank()) fromDt = LocalDate.parse(from).atStartOfDay();
            if (to   != null && !to.isBlank())   toDt   = LocalDate.parse(to).atTime(23, 59, 59);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de fecha inválido (yyyy-MM-dd)");
        }

        // Firma multi-sucursal:
        List<SaleReturnDto> list = returnService.listReturns(sucursalId, saleId, fromDt, toDt);

        // Si tu servicio aún usa otra firma, ajustalo aquí.
        return ResponseEntity.ok(list);
    }
}
