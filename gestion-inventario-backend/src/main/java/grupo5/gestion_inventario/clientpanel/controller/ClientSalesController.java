package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.SaleDto;
import grupo5.gestion_inventario.clientpanel.dto.SaleRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.service.SalesService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/sales")
@PreAuthorize("hasAnyRole('ROLE_CLIENT','ROLE_ADMINISTRADOR','ROLE_CAJERO','ROLE_MULTIFUNCION')")
public class ClientSalesController {

    private final SalesService salesService;
    private final ClientRepository clientRepo;
    private final EmployeeRepository employeeRepo;

    public ClientSalesController(SalesService salesService,
                                 ClientRepository clientRepo,
                                 EmployeeRepository employeeRepo) {
        this.salesService = salesService;
        this.clientRepo = clientRepo;
        this.employeeRepo = employeeRepo;
    }

    private Client validateClient(Long clientId, Authentication auth) {
        String username = auth.getName();
        Client client;
        // Si es dueño (ROLE_CLIENT)
        if (auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CLIENT"))) {
            client = clientRepo.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        } else {
            // Si es empleado (ADMINISTRADOR, CAJERO, MULTIFUNCION)
            Employee emp = employeeRepo.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
            client = emp.getClient();
        }
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
        return client;
    }

    @GetMapping
    public ResponseEntity<List<SaleDto>> listSales(
            @PathVariable Long clientId,
            Authentication auth) {
        validateClient(clientId, auth);
        return ResponseEntity.ok(salesService.findByClientId(clientId));
    }

    @PostMapping
    public ResponseEntity<SaleDto> createSale(
            @PathVariable Long clientId,
            @RequestBody SaleRequest req,
            Authentication auth) {

        validateClient(clientId, auth);

        // Ahora employeeId ya viene en el token y en el DTO
        if (req.getEmployeeId() == null) {
            throw new RuntimeException("El token debe incluir employeeId");
        }

        SaleDto created = salesService.createSale(clientId, req);
        return ResponseEntity.ok(created);
    }
}
