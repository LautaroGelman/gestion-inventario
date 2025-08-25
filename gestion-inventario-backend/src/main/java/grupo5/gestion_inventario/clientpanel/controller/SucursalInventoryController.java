// backend/src/main/java/grupo5/gestion_inventario/clientpanel/controller/SucursalInventoryController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.ProductDto;
import grupo5.gestion_inventario.clientpanel.dto.ProductRequest;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.model.Sucursal;
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

/**
 * Inventario por SUCURSAL.
 *
 * Reglas de autorización:
 * - Lectura (GET/list, GET/one, GET/deleted): incluye CAJERO y VENTAS_INVENTARIO (pueden ver para vender).
 * - Escritura (POST/PUT/DELETE/restore): restringido a PROPIETARIO, ADMINISTRADOR, MULTIFUNCION, INVENTARIO.
 */
@RestController
@RequestMapping("/api/client-panel/{clientId}/sucursales/{sucursalId}/items")
@PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','CAJERO','VENTAS_INVENTARIO')")
public class SucursalInventoryController {

    private final EmployeeRepository employeeRepo;
    private final SucursalRepository sucursalRepo;
    private final ProductService     productService;

    public SucursalInventoryController(EmployeeRepository employeeRepo,
                                       SucursalRepository sucursalRepo,
                                       ProductService productService) {
        this.employeeRepo = employeeRepo;
        this.sucursalRepo = sucursalRepo;
        this.productService = productService;
    }

    /* --------------------------------------------------------
     *  Validaciones
     * -------------------------------------------------------- */
    private Sucursal validateAccessAndGetSucursal(Long clientId, Long sucursalId, Authentication auth) {
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

        // Propietario puede operar en cualquier sucursal del cliente; el resto, sólo en la propia.
        boolean propietario = emp.getRole() == EmployeeRole.PROPIETARIO;
        if (!propietario) {
            if (emp.getSucursal() == null || !emp.getSucursal().getId().equals(sucursalId)) {
                throw new AccessDeniedException("No autorizado para esta sucursal");
            }
        }
        return sucursal;
    }

    /* --------------------------------------------------------
     *  LECTURA (CAJERO incluido)
     * -------------------------------------------------------- */

    @GetMapping
    public ResponseEntity<List<ProductDto>> list(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            Authentication auth) {
        validateAccessAndGetSucursal(clientId, sucursalId, auth);
        return ResponseEntity.ok(productService.findBySucursalId(sucursalId));
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ProductDto> getOne(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long productId,
            Authentication auth) {
        Sucursal sucursal = validateAccessAndGetSucursal(clientId, sucursalId, auth);
        return productService.findDtoByIdAndSucursal(productId, sucursal)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    /* --------------------------------------------------------
     *  ESCRITURA (restringido a roles “fuertes”)
     * -------------------------------------------------------- */

    @PostMapping
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO')")
    public ResponseEntity<ProductDto> create(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestBody ProductRequest body,
            Authentication auth) {
        Sucursal sucursal = validateAccessAndGetSucursal(clientId, sucursalId, auth);
        ProductDto created = productService.create(sucursal, body);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{productId}")
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO')")
    public ResponseEntity<ProductDto> update(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long productId,
            @RequestBody ProductRequest body,
            Authentication auth) {
        Sucursal sucursal = validateAccessAndGetSucursal(clientId, sucursalId, auth);
        return productService.updateProduct(productId, body, sucursal)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado o no pertenece a la sucursal"));
    }

    @DeleteMapping("/{productId}")
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long productId,
            Authentication auth) {
        validateAccessAndGetSucursal(clientId, sucursalId, auth);
        boolean ok = productService.deleteProduct(productId, sucursalId);
        if (!ok) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado o no pertenece a la sucursal");
    }

    /* Opcionales si usás soft-delete con @Where(active=true) */
    @GetMapping("/deleted")
    public ResponseEntity<List<ProductDto>> listDeleted(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            Authentication auth) {
        validateAccessAndGetSucursal(clientId, sucursalId, auth);
        return ResponseEntity.ok(productService.findDeletedBySucursal(sucursalId));
    }

    @PostMapping("/{productId}/restore")
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restore(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long productId,
            Authentication auth) {
        validateAccessAndGetSucursal(clientId, sucursalId, auth);
        boolean ok = productService.restoreProduct(productId, sucursalId);
        if (!ok) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado o no pertenece a la sucursal");
    }
}
