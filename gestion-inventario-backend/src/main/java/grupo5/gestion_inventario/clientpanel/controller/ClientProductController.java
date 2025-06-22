package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.ProductDto;
import grupo5.gestion_inventario.clientpanel.dto.ProductRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/items")
@PreAuthorize("hasAnyRole('ROLE_CLIENT','ROLE_ADMINISTRADOR','ROLE_CAJERO','ROLE_MULTIFUNCION')")
public class ClientProductController {

    private final ProductService productService;
    private final ClientRepository clientRepo;

    public ClientProductController(ProductService productService, ClientRepository clientRepo) {
        this.productService = productService;
        this.clientRepo = clientRepo;
    }

    private Client validateClient(Long clientId, Authentication auth) {
        Client client = clientRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
        return client;
    }

    /**
     * Listar todos los productos del cliente
     */
    @GetMapping
    public ResponseEntity<List<ProductDto>> listItems(
            @PathVariable Long clientId,
            Authentication auth) {
        validateClient(clientId, auth);
        List<ProductDto> items = productService.findByClientId(clientId);
        return ResponseEntity.ok(items);
    }

    /**
     * Obtener un producto por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getItem(
            @PathVariable Long clientId,
            @PathVariable Long id,
            Authentication auth) {
        Client client = validateClient(clientId, auth);
        return productService.findDtoByIdAndClient(id, client)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Crear un nuevo producto
     */
    @PostMapping
    public ResponseEntity<ProductDto> createItem(
            @PathVariable Long clientId,
            @RequestBody ProductRequest req,
            Authentication auth) {
        Client client = validateClient(clientId, auth);
        ProductDto created = productService.create(client, req);
        return ResponseEntity.ok(created);
    }

    /**
     * Actualizar un producto existente
     */
    @PutMapping("/{id}")
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

    /**
     * Eliminar un producto
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable Long clientId,
            @PathVariable Long id,
            Authentication auth) {
        Client client = validateClient(clientId, auth);
        boolean deleted = productService.deleteProduct(id, client);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
