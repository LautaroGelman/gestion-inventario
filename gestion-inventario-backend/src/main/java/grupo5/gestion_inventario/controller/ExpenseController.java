package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.clientpanel.model.Expense;
import grupo5.gestion_inventario.service.ExpenseService;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.repository.ClientRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/clients/{clientId}/expenses")
@PreAuthorize("hasAnyRole('CLIENT','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')")
public class ExpenseController {

    private final ExpenseService service;
    private final ClientRepository clientRepository;

    public ExpenseController(ExpenseService service, ClientRepository clientRepository) {
        this.service = service;
        this.clientRepository = clientRepository;
    }

    private Client validateClient(Long clientId, Authentication auth) {
        return clientRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente no encontrado"));
    }

    @PostMapping
    public ResponseEntity<Expense> create(
            @PathVariable Long clientId,
            @RequestBody Expense expense,
            Authentication auth) {
        validateClient(clientId, auth);
        Expense created = service.create(clientId, expense);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<List<Expense>> list(
            @PathVariable Long clientId,
            Authentication auth) {
        validateClient(clientId, auth);
        List<Expense> expenses = service.findByClientId(clientId);
        return ResponseEntity.ok(expenses);
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long clientId,
            @PathVariable Long expenseId,
            Authentication auth) {
        validateClient(clientId, auth);
        if (service.delete(clientId, expenseId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
