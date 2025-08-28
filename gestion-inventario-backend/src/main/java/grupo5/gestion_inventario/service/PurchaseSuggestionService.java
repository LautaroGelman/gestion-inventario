package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.model.Product;
import grupo5.gestion_inventario.model.Provider;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.repository.ProviderBranchRepository;
import grupo5.gestion_inventario.repository.ProviderRepository;
import grupo5.gestion_inventario.repository.ProductRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchaseSuggestionService {

    private final ProductRepository productRepo;
    private final ProviderRepository providerRepo;
    private final SucursalRepository sucursalRepo;
    private final ProviderBranchRepository providerBranchRepo;

    // ---------------- DTOs ----------------
    @Data
    @Builder
    public static class SuggestionsResponse {
        private Long providerId;
        private Long sucursalId;
        private Instant generatedAt;
        private List<SuggestionItem> items;
    }

    @Data
    @Builder
    public static class SuggestionItem {
        private Long productId;
        private String code;               // ← requerido por el front
        private String name;               // ← requerido por el front
        private Integer currentQty;
        private Integer lowStockThreshold;
        private Integer reorderQtyDefault;
        private Integer suggestedQty;
        private Reason reason;
    }

    public enum Reason {
        PREFERRED_DEFAULT,
        LOW_STOCK_AND_PREFERRED,
        PREFERRED_NO_LOW_STOCK,
        PREFERRED_NO_THRESHOLD
    }

    // -------------- Core API --------------
    public SuggestionsResponse suggest(Long clientId,
                                       Long sucursalId,
                                       Long providerId,
                                       boolean onlyLowStock,
                                       Integer limit) {

        // 1) Validaciones de multi-tenant y vínculo activo
        Sucursal suc = sucursalRepo.findById(sucursalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada"));
        if (suc.getClient() == null || !suc.getClient().getId().equals(clientId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La sucursal no pertenece al cliente");
        }

        Provider provider = providerRepo.findById(providerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proveedor no encontrado"));

        if (provider.getClient() == null || !provider.getClient().getId().equals(clientId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Proveedor de otro cliente");
        }

        var linkOpt = providerBranchRepo.findByProviderIdAndSucursalId(providerId, sucursalId);
        if (linkOpt.isEmpty() || !linkOpt.get().isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El proveedor no está activo en esta sucursal");
        }

        // 2) Fuente de productos
        List<Product> base = onlyLowStock
                ? productRepo.findLowStockPreferred(sucursalId, providerId)
                : productRepo.findAllBySucursalAndPreferred(sucursalId, providerId);

        // 3) Map → SuggestionItem con code y name SIEMPRE presentes
        List<SuggestionItem> items = base.stream()
                .map(p -> {
                    int qty = nvl(p.getQuantity());
                    Integer threshold = p.getLowStockThreshold();
                    Integer reorderDef = p.getReorderQtyDefault();

                    boolean isLow = threshold != null && qty <= threshold;
                    int suggested;

                    Reason reason;
                    if (isLow && reorderDef != null && reorderDef > 0) {
                        suggested = reorderDef;
                        reason = Reason.PREFERRED_DEFAULT; // bajo stock + usa default
                    } else if (isLow) {
                        // Si no hay reorder por defecto, proponemos cubrir el faltante mínimo (al menos 1)
                        int gap = threshold - qty;
                        suggested = Math.max(gap > 0 ? gap : 1, 1);
                        reason = Reason.LOW_STOCK_AND_PREFERRED;
                    } else if (reorderDef != null && reorderDef > 0) {
                        suggested = reorderDef;
                        reason = Reason.PREFERRED_NO_LOW_STOCK;
                    } else {
                        suggested = 0; // no sugerimos nada si no hay criterio
                        reason = Reason.PREFERRED_NO_THRESHOLD;
                    }

                    return SuggestionItem.builder()
                            .productId(p.getId())
                            .code(nullToEmpty(p.getCode()))
                            .name(nullToEmpty(p.getName()))
                            .currentQty(qty)
                            .lowStockThreshold(threshold)
                            .reorderQtyDefault(reorderDef)
                            .suggestedQty(suggested)
                            .reason(reason)
                            .build();
                })
                .filter(it -> !onlyLowStock || it.getSuggestedQty() > 0) // si onlyLowStock, descartá sugerencias 0
                .toList();

        if (limit != null && limit > 0 && items.size() > limit) {
            items = items.subList(0, limit);
        }

        return SuggestionsResponse.builder()
                .providerId(providerId)
                .sucursalId(sucursalId)
                .generatedAt(Instant.now())
                .items(items)
                .build();
    }

    // -------------- helpers --------------
    private static int nvl(Integer x) { return x == null ? 0 : x; }
    private static String nullToEmpty(String s) { return s == null ? "" : s; }
}
