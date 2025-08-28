package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.ProductDto;
import grupo5.gestion_inventario.clientpanel.dto.ProductRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Product;
import grupo5.gestion_inventario.model.Provider;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.repository.ProductRepository;
import grupo5.gestion_inventario.repository.ProviderBranchRepository;
import grupo5.gestion_inventario.repository.ProviderRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository  productRepo;
    private final SucursalRepository sucursalRepo;
    private final ProviderRepository providerRepo;
    private final ProviderBranchRepository providerBranchRepo;

    public ProductService(ProductRepository productRepo,
                          SucursalRepository sucursalRepo,
                          ProviderRepository providerRepo,
                          ProviderBranchRepository providerBranchRepo) {
        this.productRepo         = productRepo;
        this.sucursalRepo        = sucursalRepo;
        this.providerRepo        = providerRepo;
        this.providerBranchRepo  = providerBranchRepo;
    }

    /* ============================================================
     *  CREATE
     * ============================================================ */
    @Transactional
    public ProductDto create(Sucursal sucursal, ProductRequest req) {
        Client client = sucursal.getClient();

        // Validación de código único por sucursal (SQL directo)
        if (productRepo.existsBySucursalIdAndCode(sucursal.getId(), req.getCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un producto con código '" + req.getCode() + "' en esta sucursal");
        }

        // Validación de stock no negativo
        if (req.getQuantity() != null && req.getQuantity() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad no puede ser negativa");
        }

        Product p = new Product();
        p.setClient(client);
        p.setSucursal(sucursal);
        p.setCode(req.getCode());
        p.setName(req.getName());
        p.setDescription(req.getDescription());
        p.setCost(req.getCost());
        p.setPrice(req.getPrice());
        p.setQuantity(req.getQuantity() != null ? req.getQuantity() : 0);
        p.setLowStockThreshold(req.getLowStockThreshold() != null ? req.getLowStockThreshold() : 0);
        p.setReorderQtyDefault(req.getReorderQtyDefault());

        // Proveedor preferido (opcional) con validación de vínculo activo
        if (req.getPreferredProviderId() != null) {
            Provider prov = ensureProviderOfClient(req.getPreferredProviderId(), client.getId());
            ensureProviderLinkedToSucursal(prov.getId(), sucursal.getId());
            p.setPreferredProvider(prov);
        }

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
                    // Validación de unicidad de código por sucursal (SQL directo)
                    productRepo.findBySucursalIdAndCode(sucursal.getId(), req.getCode())
                            .filter(conflict -> !conflict.getId().equals(productId))
                            .ifPresent(conflict -> {
                                throw new ResponseStatusException(HttpStatus.CONFLICT,
                                        "Ya existe otro producto con código '" + req.getCode() + "' en esta sucursal");
                            });

                    // Validación de stock no negativo
                    if (req.getQuantity() != null && req.getQuantity() < 0) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad no puede ser negativa");
                    }

                    p.setCode(req.getCode());
                    p.setName(req.getName());
                    p.setDescription(req.getDescription());
                    p.setCost(req.getCost());
                    p.setPrice(req.getPrice());
                    p.setQuantity(req.getQuantity() != null ? req.getQuantity() : 0);
                    p.setLowStockThreshold(req.getLowStockThreshold() != null ? req.getLowStockThreshold() : 0);
                    p.setReorderQtyDefault(req.getReorderQtyDefault());

                    if (req.getPreferredProviderId() != null) {
                        Provider prov = ensureProviderOfClient(req.getPreferredProviderId(), sucursal.getClient().getId());
                        ensureProviderLinkedToSucursal(prov.getId(), sucursal.getId());
                        p.setPreferredProvider(prov);
                    } else {
                        p.setPreferredProvider(null);
                    }

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
    public Optional<ProductDto> findDtoByIdAndSucursal(Long productId, Sucursal sucursal) {
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
                .map(p -> {
                    // Restaurar registro
                    productRepo.restore(sucursalId, productId);

                    // Validar proveedor preferido al restaurar
                    Product restored = productRepo.findById(productId).orElseThrow();
                    if (restored.getPreferredProvider() != null) {
                        Long provId = restored.getPreferredProvider().getId();
                        boolean linked = providerBranchRepo.existsByProviderIdAndSucursalId(provId, sucursalId);
                        if (!linked) {
                            restored.setPreferredProvider(null);
                            productRepo.save(restored);
                        }
                    }
                    return true;
                })
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

    private Provider ensureProviderOfClient(Long providerId, Long clientId) {
        Provider p = providerRepo.findById(providerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proveedor no existe: " + providerId));
        if (p.getClient() == null || !p.getClient().getId().equals(clientId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Proveedor de otro cliente");
        }
        return p;
    }

    private void ensureProviderLinkedToSucursal(Long providerId, Long sucursalId) {
        boolean linked = providerBranchRepo.existsByProviderIdAndSucursalId(providerId, sucursalId);
        if (!linked) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Proveedor preferido no está activo en esta sucursal");
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
                p.getPrice(),
                p.getLowStockThreshold(),
                p.getReorderQtyDefault(),
                p.getPreferredProvider() != null ? p.getPreferredProvider().getId() : null,
                p.getPreferredProvider() != null ? p.getPreferredProvider().getName() : null
        );
    }

    @Transactional(readOnly = true)
    public List<ProductDto> findDeletedBySucursal(Long sucursalId) {
        confirmarSucursalExiste(sucursalId);
        return productRepo.findDeletedBySucursalId(sucursalId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

}
