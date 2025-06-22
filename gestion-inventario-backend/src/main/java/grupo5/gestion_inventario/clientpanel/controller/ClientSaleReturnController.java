// Ajuste en SaleReturnController para exponer bajo client-panel
// src/main/java/grupo5/gestion_inventario/clientpanel/controller/ClientSaleReturnController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.SaleReturnRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.service.SaleReturnService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/returns")
@PreAuthorize("hasAnyRole('ROLE_CLIENT','ROLE_ADMINISTRADOR','ROLE_CAJERO','ROLE_MULTIFUNCION')")
public class ClientSaleReturnController {

    private final SaleReturnService returnService;
    private final ClientRepository clientRepo;

    public ClientSaleReturnController(SaleReturnService returnService, ClientRepository clientRepo) {
        this.returnService = returnService;
        this.clientRepo    = clientRepo;
    }

    private Client validateClient(Long clientId, Authentication auth) {
        Client c = clientRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        if (!c.getId().equals(clientId)) throw new RuntimeException("No autorizado");
        return c;
    }

    @PostMapping
    public ResponseEntity<?> createReturn(
            @PathVariable Long clientId,
            @RequestBody SaleReturnRequest req,
            Authentication auth) {
        validateClient(clientId, auth);
        return ResponseEntity.ok(returnService.createSaleReturn(req));
    }
}
