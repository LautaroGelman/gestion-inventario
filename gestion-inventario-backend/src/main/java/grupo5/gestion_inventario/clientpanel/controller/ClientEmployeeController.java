// src/main/java/grupo5/gestion_inventario/clientpanel/controller/ClientEmployeeController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.CreateEmployeeRequest;
import grupo5.gestion_inventario.clientpanel.dto.EmployeeDto;
import grupo5.gestion_inventario.clientpanel.dto.UpdateEmployeeRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/employees")
@PreAuthorize("hasAnyRole('ROLE_CLIENT','ROLE_ADMINISTRADOR','ROLE_CAJERO','ROLE_MULTIFUNCION')")
public class ClientEmployeeController {

    private final EmployeeService employeeService;
    private final ClientRepository clientRepo;

    public ClientEmployeeController(EmployeeService employeeService, ClientRepository clientRepo) {
        this.employeeService = employeeService;
        this.clientRepo      = clientRepo;
    }

    private Client validateClient(Long clientId, Authentication auth) {
        Client c = clientRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        if (!c.getId().equals(clientId)) {
            throw new RuntimeException("No autorizado para este cliente");
        }
        return c;
    }

    @GetMapping
    public List<EmployeeDto> list(@PathVariable Long clientId, Authentication auth) {
        validateClient(clientId, auth);
        return employeeService.findByClientId(clientId);
    }

    @PostMapping
    public EmployeeDto create(
            @PathVariable Long clientId,
            @RequestBody CreateEmployeeRequest req,
            Authentication auth) {
        validateClient(clientId, auth);
        return employeeService.create(clientId, req);
    }

    @PutMapping("/{id}")
    public EmployeeDto update(
            @PathVariable Long clientId,
            @PathVariable Long id,
            @RequestBody UpdateEmployeeRequest req,
            Authentication auth) {
        validateClient(clientId, auth);
        return employeeService.update(clientId, id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long clientId,
            @PathVariable Long id,
            Authentication auth) {
        validateClient(clientId, auth);
        employeeService.delete(clientId, id);
        return ResponseEntity.noContent().build();
    }
}
