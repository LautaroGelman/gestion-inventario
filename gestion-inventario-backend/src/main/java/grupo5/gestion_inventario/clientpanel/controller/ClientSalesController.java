package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.SaleDto;
import grupo5.gestion_inventario.clientpanel.dto.SaleRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
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
public class ClientSalesController {

    private final SalesService salesService;
    private final EmployeeRepository employeeRepo;

    public ClientSalesController(SalesService salesService,
                                 EmployeeRepository employeeRepo) {
        this.salesService  = salesService;
        this.employeeRepo  = employeeRepo;
    }

    private Client validateClient(Long clientId, Authentication auth) {
        // 1) Cargar al empleado autenticado
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        // 2) Obtener su cliente y verificar que coincide con el path
        Client client = emp.getClient();
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
        return client;
    }

    /**
     * Listar todas las ventas (incluye ROLE_CAJERO)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('CLIENT','ADMINISTRADOR','CAJERO','MULTIFUNCION')")
    public ResponseEntity<List<SaleDto>> listSales(
            @PathVariable Long clientId,
            Authentication auth) {

        validateClient(clientId, auth);
        List<SaleDto> list = salesService.findByClientId(clientId);
        return ResponseEntity.ok(list);
    }

    /**
     * Crear una nueva venta (AHORA INCLUYE ROLE_CAJERO)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENT','ADMINISTRADOR','CAJERO','MULTIFUNCION')")
    public ResponseEntity<SaleDto> createSale(
            @PathVariable Long clientId,
            @RequestBody SaleRequest req,
            Authentication auth) {

        validateClient(clientId, auth);

        if (req.getEmployeeId() == null) {
            throw new RuntimeException("El token debe incluir employeeId");
        }

        SaleDto created = salesService.createSale(clientId, req);
        return ResponseEntity.ok(created);
    }
}
