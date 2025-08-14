// backend/src/main/java/grupo5/gestion_inventario/service/ProductService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.ProductDto;
import grupo5.gestion_inventario.clientpanel.dto.ProductRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Product;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.repository.ProductRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository  productRepo;
    private final SucursalRepository sucursalRepo;

    public ProductService(ProductRepository productRepo,
                          SucursalRepository sucursalRepo) {
        this.productRepo  = productRepo;
        this.sucursalRepo = sucursalRepo;
    }

    /* ============================================================
     *  CREATE
     * ============================================================ */
    @Transactional
    public ProductDto create(Sucursal sucursal, ProductRequest req) {

        Client client = sucursal.getClient();   // para compat. legacy
        Product p    = new Product();

        p.setClient(client);
        p.setSucursal(sucursal);
        p.setCode(req.getCode());
        p.setName(req.getName());
        p.setDescription(req.getDescription());
        p.setCost(req.getCost());
        p.setPrice(req.getPrice());
        p.setQuantity(req.getQuantity());
        p.setLowStockThreshold(
                req.getLowStockThreshold() != null ? req.getLowStockThreshold() : 0);

        return toDto(productRepo.save(p));
    }

    /* ============================================================
     *  UPDATE
     * ============================================================ */
    @Transactional
    public Optional<ProductDto> updateProduct(Long productId,
                                              ProductRequest req,
                                              Sucursal sucursal) {

        return productRepo.findById(productId)
                .filter(p -> p.getSucursal().getId().equals(sucursal.getId()))
                .map(p -> {
                    p.setCode(req.getCode());
                    p.setName(req.getName());
                    p.setDescription(req.getDescription());
                    p.setCost(req.getCost());
                    p.setPrice(req.getPrice());
                    p.setQuantity(req.getQuantity());
                    p.setLowStockThreshold(
                            req.getLowStockThreshold() != null ? req.getLowStockThreshold() : 0);
                    return toDto(productRepo.save(p));
                });
    }

    /* ============================================================
     *  READ
     * ============================================================ */
    @Transactional(readOnly = true)
    public List<ProductDto> findBySucursalId(Long sucursalId) {
        confirmarSucursalExiste(sucursalId);
        return productRepo.findBySucursalId(sucursalId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ProductDto> findDtoByIdAndSucursal(Long productId,
                                                       Sucursal sucursal) {

        return productRepo.findById(productId)
                .filter(p -> p.getSucursal().getId().equals(sucursal.getId()))
                .map(this::toDto);
    }

    /* ============================================================
     *  DELETE / RESTORE
     * ============================================================ */
    @Transactional
    public boolean deleteProduct(Long productId, Long sucursalId) {

        return productRepo.findById(productId)
                .filter(p -> p.getSucursal().getId().equals(sucursalId))
                .map(p -> { productRepo.delete(p); return true; })
                .orElse(false);
    }

    @Transactional
    public boolean restoreProduct(Long productId, Long sucursalId) {

        return productRepo.findById(productId)
                .filter(p -> p.getSucursal().getId().equals(sucursalId))
                .map(p -> { productRepo.restore(sucursalId, productId); return true; })
                .orElse(false);
    }

    /* ============================================================
     *  MÉTRICAS
     * ============================================================ */
    @Transactional(readOnly = true)
    public long countLowStock(Long sucursalId) {
        confirmarSucursalExiste(sucursalId);
        return productRepo.countLowStock(sucursalId);
    }

    /* ============================================================
     *  HELPERS
     * ============================================================ */
    private void confirmarSucursalExiste(Long sucursalId) {
        if (!sucursalRepo.existsById(sucursalId)) {
            throw new IllegalArgumentException("Sucursal no encontrada: " + sucursalId);
        }
    }

    private ProductDto toDto(Product p) {
        return new ProductDto(
                p.getId(),
                p.getCode(),
                p.getName(),
                p.getDescription(),
                p.getQuantity(),
                p.getCost(),
                p.getPrice()
        );
    }
}
