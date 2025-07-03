package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.clientpanel.dto.SalesDailySummaryDto;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.service.SalesService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/clients/{clientId}/sales")
@PreAuthorize("hasAnyRole('CLIENT','CAJERO','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO','ADMINISTRADOR')")
public class SalesMetricsController {

    private final SalesService service;
    private final ClientRepository clientRepo;

    public SalesMetricsController(SalesService service,
                                  ClientRepository clientRepo) {
        this.service = service;
        this.clientRepo = clientRepo;
    }

    private Client validateClient(Long clientId, Authentication auth) {
        Client client = clientRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente no autenticado"));
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
        return client;
    }

    @GetMapping("/summary")
    public ResponseEntity<List<SalesDailySummaryDto>> getSummary(
            @PathVariable Long clientId,
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {

        validateClient(clientId, auth);
        List<SalesDailySummaryDto> summary = service.summaryLastDays(clientId, days);
        return ResponseEntity.ok(summary);
    }
}
