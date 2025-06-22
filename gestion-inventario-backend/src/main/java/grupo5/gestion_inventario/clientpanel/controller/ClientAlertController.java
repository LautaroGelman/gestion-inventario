package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.model.Alert;
import grupo5.gestion_inventario.clientpanel.repository.AlertRepository;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/alerts")
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasAnyRole('ROLE_CLIENT','ROLE_ADMINISTRADOR','ROLE_CAJERO','ROLE_MULTIFUNCION')")
public class ClientAlertController {

    @Autowired private AlertRepository alertRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private EmployeeRepository employeeRepository;

    private Client validateClient(Long clientId, Authentication auth) {
        String username = auth.getName();
        Client client;
        if (auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CLIENT"))) {
            client = clientRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        } else {
            Employee emp = employeeRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
            client = emp.getClient();
        }
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
        return client;
    }

    @GetMapping
    public ResponseEntity<List<Alert>> getUnreadAlerts(
            @PathVariable Long clientId,
            Authentication auth) {
        validateClient(clientId, auth);
        List<Alert> alerts = alertRepository
                .findByClientIdAndIsReadFalseOrderByCreatedAtDesc(clientId);
        return ResponseEntity.ok(alerts);
    }

    @PostMapping("/{alertId}/mark-as-read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long clientId,
            @PathVariable Long alertId,
            Authentication auth) {
        validateClient(clientId, auth);

        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alerta no encontrada"));

        if (!alert.getClient().getId().equals(clientId)) {
            return ResponseEntity.status(403).build();
        }

        alert.setRead(true);
        alertRepository.save(alert);
        return ResponseEntity.ok().build();
    }
}
