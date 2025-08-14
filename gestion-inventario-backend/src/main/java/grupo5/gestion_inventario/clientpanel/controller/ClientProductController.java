// backend/src/main/java/grupo5/gestion_inventario/clientpanel/controller/ClientProductController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.*;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/sucursales/{sucursalId}/items")
public class ClientProductController {

    private final ProductService     productService;
    private final EmployeeRepository employeeRepo;
    private final SucursalRepository sucursalRepo;

    public ClientProductController(ProductService     productService,
                                   EmployeeRepository employeeRepo,
                                   SucursalRepository sucursalRepo) {
        this.productService = productService;
        this.employeeRepo   = employeeRepo;
        this.sucursalRepo   = sucursalRepo;
    }

    /* ---------- Validación de acceso ---------- */
    private Sucursal validateAccess(Long clientId,
                                    Long sucursalId,
                                    Authentication auth) {

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
            if (emp.getSucursal() == null ||
                    !emp.getSucursal().getId().equals(sucursalId)) {
                throw new AccessDeniedException("No autorizado para esta sucursal");
            }
        }
        return sucursal;
    }

    /* ---------- LISTAR (incluye CAJERO) ---------- */
    @GetMapping
    @PreAuthorize(
            "hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')"
    )
    public ResponseEntity<List<ProductDto>> listItems(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            Authentication auth) {

        Sucursal sucursal = validateAccess(clientId, sucursalId, auth);
        return ResponseEntity.ok(
                productService.findBySucursalId(sucursal.getId())
        );
    }

    /* ---------- OBTENER POR ID ---------- */
    @GetMapping("/{id}")
    @PreAuthorize(
            "hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')"
    )
    public ResponseEntity<ProductDto> getItem(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long id,
            Authentication auth) {

        Sucursal sucursal = validateAccess(clientId, sucursalId, auth);
        return productService.findDtoByIdAndSucursal(id, sucursal)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* ---------- CREAR (excluye CAJERO) ---------- */
    @PostMapping
    @PreAuthorize(
            "hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')"
    )
    public ResponseEntity<ProductDto> createItem(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestBody ProductRequest req,
            Authentication auth) {

        Sucursal sucursal = validateAccess(clientId, sucursalId, auth);
        return ResponseEntity.ok(productService.create(sucursal, req));
    }

    /* ---------- ACTUALIZAR (excluye CAJERO) ---------- */
    @PutMapping("/{id}")
    @PreAuthorize(
            "hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')"
    )
    public ResponseEntity<ProductDto> updateItem(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long id,
            @RequestBody ProductRequest req,
            Authentication auth) {

        Sucursal sucursal = validateAccess(clientId, sucursalId, auth);
        return productService.updateProduct(id, req, sucursal)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* ---------- ELIMINAR (excluye CAJERO) ---------- */
    @DeleteMapping("/{id}")
    @PreAuthorize(
            "hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')"
    )
    public ResponseEntity<Void> deleteItem(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long id,
            Authentication auth) {

        Sucursal sucursal = validateAccess(clientId, sucursalId, auth);
        boolean deleted = productService.deleteProduct(id, sucursal.getId()); // FIX
        return deleted ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
