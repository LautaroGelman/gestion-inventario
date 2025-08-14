// backend/src/main/java/grupo5/gestion_inventario/controller/PurchaseOrderController.java
package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.clientpanel.dto.PurchaseOrderRequest;
import grupo5.gestion_inventario.clientpanel.model.PurchaseOrder;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.service.PurchaseOrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping(
        "/api/client-panel/{clientId}/sucursales/{sucursalId}/purchase-orders")
@CrossOrigin(origins = "http://localhost:3000")
@PreAuthorize(
        "hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final EmployeeRepository   employeeRepo;
    private final SucursalRepository   sucursalRepo;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService,
                                   EmployeeRepository   employeeRepo,
                                   SucursalRepository   sucursalRepo) {
        this.purchaseOrderService = purchaseOrderService;
        this.employeeRepo         = employeeRepo;
        this.sucursalRepo         = sucursalRepo;
    }

    /* --------------------------------------------------------
     *  Helper de validación
     * -------------------------------------------------------- */
    private Sucursal validateAccess(Long clientId,
                                    Long sucursalId,
                                    Authentication auth) {

        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Empleado no encontrado"));

        if (!emp.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("Cliente no autorizado");
        }

        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada"));

        if (!sucursal.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("La sucursal no pertenece al cliente");
        }

        boolean esPropietario = emp.getRole() == EmployeeRole.PROPIETARIO;

        if (!esPropietario) {
            if (emp.getSucursal() == null ||
                    !emp.getSucursal().getId().equals(sucursalId)) {
                throw new AccessDeniedException("No autorizado para esta sucursal");
            }
        }
        return sucursal;
    }

    /* --------------------------------------------------------
     *  Listar órdenes de compra de la sucursal
     * -------------------------------------------------------- */
    @GetMapping
    public ResponseEntity<List<PurchaseOrder>> getAll(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            Authentication   auth) {

        validateAccess(clientId, sucursalId, auth);
        List<PurchaseOrder> list =
                purchaseOrderService.findAllBySucursalId(sucursalId);
        return ResponseEntity.ok(list);
    }

    /* --------------------------------------------------------
     *  Obtener orden por ID
     * -------------------------------------------------------- */
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getById(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long id,
            Authentication   auth) {

        validateAccess(clientId, sucursalId, auth);
        return purchaseOrderService.getPurchaseOrderById(id, sucursalId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* --------------------------------------------------------
     *  Crear orden
     * -------------------------------------------------------- */
    @PostMapping
    public ResponseEntity<PurchaseOrder> create(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestBody   PurchaseOrderRequest request,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);
        PurchaseOrder po =
                purchaseOrderService.create(sucursalId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(po);
    }

    /* --------------------------------------------------------
     *  Recibir orden
     * -------------------------------------------------------- */
    @PostMapping("/{id}/receive")
    public ResponseEntity<PurchaseOrder> receive(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long id,
            Authentication   auth) {

        validateAccess(clientId, sucursalId, auth);
        PurchaseOrder po =
                purchaseOrderService.receive(id, sucursalId);
        return ResponseEntity.ok(po);
    }
}
