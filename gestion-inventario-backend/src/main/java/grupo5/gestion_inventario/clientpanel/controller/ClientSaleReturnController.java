package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.SaleReturnRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.service.SaleReturnService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/returns")
public class ClientSaleReturnController {

    private final SaleReturnService returnService;
    private final EmployeeRepository employeeRepo;

    public ClientSaleReturnController(SaleReturnService returnService,
                                      EmployeeRepository employeeRepo) {
        this.returnService = returnService;
        this.employeeRepo  = employeeRepo;
    }

    private Client validateClient(Long clientId, Authentication auth) {
        // Carga al empleado (incluye al dueño como ADMINISTRADOR)
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        Client client = emp.getClient();
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
        return client;
    }

    /**
     * Crear una devolución de venta (incluye ROLE_CAJERO)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENT','ADMINISTRADOR','CAJERO','MULTIFUNCION')")
    public ResponseEntity<?> createReturn(
            @PathVariable Long clientId,
            @RequestBody SaleReturnRequest req,
            Authentication auth) {
        validateClient(clientId, auth);
        return ResponseEntity.ok(returnService.createSaleReturn(req));
    }
}

