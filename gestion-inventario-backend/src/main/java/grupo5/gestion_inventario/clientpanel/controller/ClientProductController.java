package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.ProductDto;
import grupo5.gestion_inventario.clientpanel.dto.ProductRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/items")
public class ClientProductController {

    private final ProductService productService;
    private final EmployeeRepository employeeRepo;

    public ClientProductController(ProductService productService,
                                   EmployeeRepository employeeRepo) {
        this.productService = productService;
        this.employeeRepo   = employeeRepo;
    }

    /* ---------- Util ---------- */
    private Client validateClient(Long clientId, Authentication auth) {
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        Client client = emp.getClient();
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
        return client;
    }

    /* ---------- LISTAR (incluye CAJERO) ---------- */
    @GetMapping
    @PreAuthorize(
            "hasAnyRole('CLIENT','ADMINISTRADOR','CAJERO','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')"
    )
    public ResponseEntity<List<ProductDto>> listItems(
            @PathVariable Long clientId,
            Authentication auth) {
        Client client = validateClient(clientId, auth);
        List<ProductDto> items = productService.findByClientId(client.getId());
        return ResponseEntity.ok(items);
    }

    /* ---------- OBTENER POR ID (incluye CAJERO) ---------- */
    @GetMapping("/{id}")
    @PreAuthorize(
            "hasAnyRole('CLIENT','ADMINISTRADOR','CAJERO','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')"
    )
    public ResponseEntity<ProductDto> getItem(
            @PathVariable Long clientId,
            @PathVariable Long id,
            Authentication auth) {
        Client client = validateClient(clientId, auth);
        return productService.findDtoByIdAndClient(id, client)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* ---------- CREAR (excluye CAJERO) ---------- */
    @PostMapping
    @PreAuthorize(
            "hasAnyRole('CLIENT','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')"
    )
    public ResponseEntity<ProductDto> createItem(
            @PathVariable Long clientId,
            @RequestBody ProductRequest req,
            Authentication auth) {
        Client client = validateClient(clientId, auth);
        ProductDto created = productService.create(client, req);
        return ResponseEntity.ok(created);
    }

    /* ---------- ACTUALIZAR (excluye CAJERO) ---------- */
    @PutMapping("/{id}")
    @PreAuthorize(
            "hasAnyRole('CLIENT','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')"
    )
    public ResponseEntity<ProductDto> updateItem(
            @PathVariable Long clientId,
            @PathVariable Long id,
            @RequestBody ProductRequest req,
            Authentication auth) {
        Client client = validateClient(clientId, auth);
        return productService.updateProduct(id, req, client)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* ---------- ELIMINAR (excluye CAJERO) ---------- */
    @DeleteMapping("/{id}")
    @PreAuthorize(
            "hasAnyRole('CLIENT','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')"
    )
    public ResponseEntity<Void> deleteItem(
            @PathVariable Long clientId,
            @PathVariable Long id,
            Authentication auth) {
        Client client = validateClient(clientId, auth);
        boolean deleted = productService.deleteProduct(id, client);
        return deleted
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
