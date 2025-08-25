// backend/src/main/java/grupo5/gestion_inventario/clientpanel/controller/SucursalSalesController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.SaleDto;
import grupo5.gestion_inventario.clientpanel.dto.SaleRequest;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.service.SalesService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/sucursales/{sucursalId}/sales")
@PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','VENTAS_INVENTARIO','MULTIFUNCION')")
public class SucursalSalesController {

    private final EmployeeRepository employeeRepo;
    private final SucursalRepository sucursalRepo;
    private final SalesService       salesService;

    public SucursalSalesController(EmployeeRepository employeeRepo,
                                   SucursalRepository sucursalRepo,
                                   SalesService salesService) {
        this.employeeRepo  = employeeRepo;
        this.sucursalRepo  = sucursalRepo;
        this.salesService  = salesService;
    }

    /* --------------------------------------------------------
     *  Validaciones
     * -------------------------------------------------------- */
    private Sucursal validateAccess(Long clientId, Long sucursalId, Authentication auth) {
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Empleado no encontrado"));

        if (!emp.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("Cliente no autorizado");
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
     *  LISTAR VENTAS
     * -------------------------------------------------------- */
    @GetMapping
    public ResponseEntity<List<SaleDto>> list(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            Authentication auth) {
        validateAccess(clientId, sucursalId, auth);
        return ResponseEntity.ok(salesService.findBySucursalId(sucursalId));
    }

    /* --------------------------------------------------------
     *  OBTENER VENTA POR ID
     * -------------------------------------------------------- */
    @GetMapping("/{saleId}")
    public ResponseEntity<SaleDto> getOne(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long saleId,
            Authentication auth) {
        validateAccess(clientId, sucursalId, auth);
        return ResponseEntity.ok(salesService.findByIdAndSucursalId(sucursalId, saleId));
    }

    /* --------------------------------------------------------
     *  CREAR VENTA
     * -------------------------------------------------------- */
    @PostMapping
    public ResponseEntity<SaleDto> create(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestBody  SaleRequest req,
            Authentication auth) {

        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Empleado no encontrado"));

        // si no vino employeeId en el body, usamos el del token
        if (req.getEmployeeId() == null) {
            req.setEmployeeId(emp.getId());
        }

        validateAccess(clientId, sucursalId, auth);
        SaleDto created = salesService.createSale(sucursalId, req); // ← importante: usar sucursalId
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
