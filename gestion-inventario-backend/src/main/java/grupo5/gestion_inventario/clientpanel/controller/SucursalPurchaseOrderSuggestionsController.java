package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.service.PurchaseSuggestionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/sucursales/{sucursalId}/purchase-orders")
public class SucursalPurchaseOrderSuggestionsController {

    private final PurchaseSuggestionService suggestionService;

    public SucursalPurchaseOrderSuggestionsController(PurchaseSuggestionService suggestionService) {
        this.suggestionService = suggestionService;
    }

    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','INVENTARIO','MULTIFUNCION')")
    @GetMapping("/suggestions")
    public PurchaseSuggestionService.SuggestionsResponse getSuggestions(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestParam Long providerId,
            @RequestParam(defaultValue = "true") boolean onlyLowStock,
            @RequestParam(required = false) Integer limit
    ) {
        return suggestionService.suggest(clientId, sucursalId, providerId, onlyLowStock, limit);
    }
}
