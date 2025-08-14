// backend/src/main/java/grupo5/gestion_inventario/controller/ClientProviderController.java
package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.clientpanel.dto.ProviderRequest;
import grupo5.gestion_inventario.clientpanel.model.Provider;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.ClientRepository;
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
@PreAuthorize(
        "hasAnyRole('PROPIETARIO','ADMINISTRADOR','INVENTARIO','VENTAS_INVENTARIO','MULTIFUNCION')"
)
public class ClientProviderController {

    private final ProviderService    providerService;
    private final ClientRepository   clientRepo;
    private final EmployeeRepository employeeRepo;

    public ClientProviderController(ProviderService    providerService,
                                    ClientRepository   clientRepo,
                                    EmployeeRepository employeeRepo) {
        this.providerService = providerService;
        this.clientRepo      = clientRepo;
        this.employeeRepo    = employeeRepo;
    }

    /* --------------------------------------------------------
     *  Helper: obtiene y valida el Cliente según el usuario
     * -------------------------------------------------------- */
    private Client validateClient(Long pathClientId, Authentication auth) {

        // ¿Usuario es empleado o propietario?
        Employee emp = employeeRepo.findByEmail(auth.getName()).orElse(null);
        if (emp != null) {
            if (!emp.getClient().getId().equals(pathClientId)) {
                throw new AccessDeniedException("Cliente no autorizado");
            }
            return emp.getClient();
        }

        // ¿Usuario es el propio cliente (flujo legacy)?
        return clientRepo.findByEmail(auth.getName())
                .filter(c -> c.getId().equals(pathClientId))
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente no autenticado"));
    }

    /* --------------------------------------------------------
     *  Listar proveedores
     * -------------------------------------------------------- */
    @GetMapping
    public ResponseEntity<List<Provider>> listProviders(
            @PathVariable Long clientId,
            Authentication   auth) {

        Client client   = validateClient(clientId, auth);
        List<Provider> providers = providerService.findByClientId(client.getId());
        return ResponseEntity.ok(providers);
    }

    /* --------------------------------------------------------
     *  Crear proveedor
     * -------------------------------------------------------- */
    @PostMapping
    public ResponseEntity<Provider> createProvider(
            @PathVariable      Long            clientId,
            @RequestBody       ProviderRequest request,
            Authentication     auth) {

        Client client = validateClient(clientId, auth);
        Provider created = providerService.create(client, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /* --------------------------------------------------------
     *  Obtener proveedor por ID
     * -------------------------------------------------------- */
    @GetMapping("/{providerId}")
    public ResponseEntity<Provider> getProviderById(
            @PathVariable Long clientId,
            @PathVariable Long providerId,
            Authentication   auth) {

        Client client = validateClient(clientId, auth);
        return providerService.findByIdAndClient(providerId, client)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* --------------------------------------------------------
     *  Actualizar proveedor
     * -------------------------------------------------------- */
    @PutMapping("/{providerId}")
    public ResponseEntity<Provider> updateProvider(
            @PathVariable Long clientId,
            @PathVariable Long providerId,
            @RequestBody  ProviderRequest request,
            Authentication auth) {

        Client client = validateClient(clientId, auth);
        return providerService.update(providerId, request, client)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* --------------------------------------------------------
     *  Eliminar proveedor
     * -------------------------------------------------------- */
    @DeleteMapping("/{providerId}")
    public ResponseEntity<Void> deleteProvider(
            @PathVariable Long clientId,
            @PathVariable Long providerId,
            Authentication   auth) {

        Client client = validateClient(clientId, auth);
        if (providerService.delete(providerId, client)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
