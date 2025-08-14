// backend/src/main/java/grupo5/gestion_inventario/controller/ProductController.java
package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.clientpanel.dto.ProductDto;
import grupo5.gestion_inventario.clientpanel.dto.ProductRequest;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.service.ProductService;
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
        "/api/client-panel/{clientId}/sucursales/{sucursalId}/products")
@PreAuthorize(
        "hasAnyRole('PROPIETARIO','ADMINISTRADOR','INVENTARIO','VENTAS_INVENTARIO','MULTIFUNCION','CAJERO')")
public class ProductController {

    private final ProductService     productService;
    private final EmployeeRepository employeeRepo;
    private final SucursalRepository sucursalRepo;

    public ProductController(ProductService     productService,
                             EmployeeRepository employeeRepo,
                             SucursalRepository sucursalRepo) {
        this.productService = productService;
        this.employeeRepo   = employeeRepo;
        this.sucursalRepo   = sucursalRepo;
    }

    /* --------------------------------------------------------
     *  Helper de validación de acceso
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
                throw new AccessDeniedException("Sucursal no autorizada");
            }
        }
        return sucursal;
    }

    /* --------------------------------------------------------
     *  Crear producto (excluye CAJERO)
     * -------------------------------------------------------- */
    @PostMapping
    @PreAuthorize(
            "hasAnyRole('PROPIETARIO','ADMINISTRADOR','INVENTARIO','VENTAS_INVENTARIO','MULTIFUNCION')")
    public ResponseEntity<ProductDto> create(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestBody    ProductRequest req,
            Authentication  auth) {

        Sucursal sucursal = validateAccess(clientId, sucursalId, auth);
        ProductDto dto    = productService.create(sucursal, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /* --------------------------------------------------------
     *  Listar inventario (incluye CAJERO)
     * -------------------------------------------------------- */
    @GetMapping
    public ResponseEntity<List<ProductDto>> list(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            Authentication  auth) {

        validateAccess(clientId, sucursalId, auth);
        return ResponseEntity.ok(
                productService.findBySucursalId(sucursalId));
    }

    /* Papelera */
    @GetMapping("/deleted")
    @PreAuthorize(
            "hasAnyRole('PROPIETARIO','ADMINISTRADOR','INVENTARIO','VENTAS_INVENTARIO','MULTIFUNCION')")
    public ResponseEntity<List<ProductDto>> listDeleted(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            Authentication  auth) {

        validateAccess(clientId, sucursalId, auth);
        return ResponseEntity.ok(
                productService.findDeletedBySucursal(sucursalId));
    }

    /* --------------------------------------------------------
     *  Obtener producto por ID
     * -------------------------------------------------------- */
    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long id,
            Authentication  auth) {

        Sucursal sucursal = validateAccess(clientId, sucursalId, auth);
        return productService.findDtoByIdAndSucursal(id, sucursal)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* --------------------------------------------------------
     *  Actualizar producto (excluye CAJERO)
     * -------------------------------------------------------- */
    @PutMapping("/{id}")
    @PreAuthorize(
            "hasAnyRole('PROPIETARIO','ADMINISTRADOR','INVENTARIO','VENTAS_INVENTARIO','MULTIFUNCION')")
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long id,
            @RequestBody  ProductRequest req,
            Authentication auth) {

        Sucursal sucursal = validateAccess(clientId, sucursalId, auth);
        return productService.updateProduct(id, req, sucursal)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* --------------------------------------------------------
     *  Eliminar producto (excluye CAJERO)
     * -------------------------------------------------------- */
    @DeleteMapping("/{id}")
    @PreAuthorize(
            "hasAnyRole('PROPIETARIO','ADMINISTRADOR','INVENTARIO','VENTAS_INVENTARIO','MULTIFUNCION')")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long id,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);
        boolean deleted = productService.deleteProduct(id, sucursalId);
        return deleted
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    /* --------------------------------------------------------
     *  Restaurar producto (excluye CAJERO)
     * -------------------------------------------------------- */
    @PostMapping("/{id}/restore")
    @PreAuthorize(
            "hasAnyRole('PROPIETARIO','ADMINISTRADOR','INVENTARIO','VENTAS_INVENTARIO','MULTIFUNCION')")
    public ResponseEntity<Void> restoreProduct(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long id,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);
        boolean restored = productService.restoreProduct(id, sucursalId);
        return restored
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
