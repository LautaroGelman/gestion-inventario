// src/main/java/grupo5/gestion_inventario/clientpanel/controller/ClientSalesController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.SaleDto;
import grupo5.gestion_inventario.clientpanel.dto.SaleRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.service.SalesService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/sucursales/{sucursalId}/sales")
public class ClientSalesController {

    private final SalesService salesService;
    private final EmployeeRepository employeeRepo;
    private final SucursalRepository sucursalRepo;

    public ClientSalesController(SalesService salesService,
                                 EmployeeRepository employeeRepo,
                                 SucursalRepository sucursalRepo) {
        this.salesService  = salesService;
        this.employeeRepo  = employeeRepo;
        this.sucursalRepo  = sucursalRepo;
    }

    /* ---------- Validación de acceso (mismo patrón que en otros controllers) ---------- */
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

    /**
     * Listar todas las ventas de la sucursal
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','VENTAS_INVENTARIO','MULTIFUNCION')")
    public ResponseEntity<List<SaleDto>> listSales(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);

        // Firma sugerida post-migración:
        List<SaleDto> list = salesService.findBySucursalId(sucursalId);

        // Si todavía tu servicio usa clientId:
        // List<SaleDto> list = salesService.findByClientId(clientId);

        return ResponseEntity.ok(list);
    }

    /**
     * Crear una nueva venta en la sucursal
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','VENTAS_INVENTARIO','MULTIFUNCION')")
    public ResponseEntity<SaleDto> createSale(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestBody SaleRequest req,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);

        if (req.getEmployeeId() == null) {
            throw new RuntimeException("El token debe incluir employeeId");
        }

        // Si tu DTO SaleRequest tiene setSucursalId, podés setearlo aquí. Si no, pasamos por parámetro.
        // try { req.setSucursalId(sucursalId); } catch (Exception ignored) {}

        // Firma sugerida post-migración:
        SaleDto created = salesService.createSale(clientId, req);

        // Si tu servicio todavía tiene la firma antigua:
        // SaleDto created = salesService.createSale(clientId, req);

        return ResponseEntity.ok(created);
    }

    /**
     * Obtener una venta por ID (de la sucursal)
     */
    @GetMapping("/{saleId}")
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','VENTAS_INVENTARIO','MULTIFUNCION')")
    public ResponseEntity<SaleDto> getSaleById(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long saleId,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);

        // Firma sugerida post-migración:
        SaleDto sale = salesService.findByIdAndSucursalId(saleId, sucursalId);

        // Si tu servicio todavía usa clientId:
        // SaleDto sale = salesService.findByIdAndClientId(clientId, saleId);

        return ResponseEntity.ok(sale);
    }
}
