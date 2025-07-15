package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.clientpanel.dto.ProductDto;
import grupo5.gestion_inventario.clientpanel.dto.ProductRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client/products")
public class ProductController {

    private final ProductService   productService;
    private final ClientRepository clientRepo;

    public ProductController(ProductService productService,
                             ClientRepository clientRepo) {
        this.productService = productService;
        this.clientRepo     = clientRepo;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENT','INVENTARIO','VENTAS_INVENTARIO','MULTIFUNCION','ADMINISTRADOR')")
    public ResponseEntity<ProductDto> create(
            @RequestBody ProductRequest req,
            Authentication auth) {
        Client client = clientRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        ProductDto dto = productService.create(client, req);
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CLIENT','INVENTARIO','VENTAS_INVENTARIO','CAJERO','MULTIFUNCION','ADMINISTRADOR')")
    public ResponseEntity<List<ProductDto>> list(Authentication auth) {
        Client client = clientRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado: " + auth.getName()));

        List<ProductDto> dtos = productService.findByClientId(client.getId());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/deleted")
    @PreAuthorize("hasAnyRole('CLIENT','INVENTARIO','VENTAS_INVENTARIO','MULTIFUNCION','ADMINISTRADOR')")
    public ResponseEntity<List<ProductDto>> listDeleted(Authentication auth) {
        Client client = clientRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado: " + auth.getName()));

        List<ProductDto> dtos = productService.findDeletedByClient(client.getId());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT','INVENTARIO','VENTAS_INVENTARIO','CAJERO','MULTIFUNCION','ADMINISTRADOR')")
    public ResponseEntity<ProductDto> getProductById(
            @PathVariable Long id,
            Authentication auth) {
        Client client = clientRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        return productService.findDtoByIdAndClient(id, client)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT','INVENTARIO','VENTAS_INVENTARIO','MULTIFUNCION','ADMINISTRADOR')")
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable Long id,
            @RequestBody ProductRequest req,
            Authentication auth) {
        Client client = clientRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        return productService.updateProduct(id, req, client)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT','INVENTARIO','VENTAS_INVENTARIO','MULTIFUNCION','ADMINISTRADOR')")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id,
            Authentication auth) {
        Client client = clientRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        boolean deleted = productService.deleteProduct(id, client);
        return deleted
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("hasAnyRole('CLIENT','INVENTARIO','VENTAS_INVENTARIO','MULTIFUNCION','ADMINISTRADOR')")
    public ResponseEntity<Void> restoreProduct(
            @PathVariable Long id,
            Authentication auth) {
        Client client = clientRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        boolean restored = productService.restoreProduct(id, client);
        return restored
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

}
