// backend/src/main/java/grupo5/gestion_inventario/clientpanel/controller/ClientProvidersController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.ProviderCreateRequest;
import grupo5.gestion_inventario.clientpanel.dto.ProviderDto;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.service.ProviderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/providers")
@PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','INVENTARIO','MULTIFUNCION')")
public class ClientProvidersController {

    private final EmployeeRepository employeeRepo;
    private final ProviderService providerService;

    public ClientProvidersController(EmployeeRepository employeeRepo, ProviderService providerService) {
        this.employeeRepo = employeeRepo;
        this.providerService = providerService;
    }

    private void validateAccess(Long clientId, Authentication auth) {
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Empleado no encontrado"));
        Client client = emp.getClient();
        if (client == null || !client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
    }

    @GetMapping
    public ResponseEntity<List<ProviderDto>> list(@PathVariable Long clientId, Authentication auth) {
        validateAccess(clientId, auth);
        return ResponseEntity.ok(providerService.findByClientId(clientId));
    }

    @PostMapping
    public ResponseEntity<ProviderDto> create(
            @PathVariable Long clientId,
            @RequestBody ProviderCreateRequest req,
            Authentication auth
    ) {
        validateAccess(clientId, auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(providerService.create(clientId, req));
    }
}
