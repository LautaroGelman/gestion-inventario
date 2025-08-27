// backend/src/main/java/grupo5/gestion_inventario/clientpanel/controller/SucursalProvidersController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.ProviderDto;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.model.Provider;
import grupo5.gestion_inventario.clientpanel.model.ProviderBranch;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.ProviderBranchRepository;
import grupo5.gestion_inventario.repository.ProviderRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/sucursales/{sucursalId}/providers")
@PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','INVENTARIO','MULTIFUNCION')")
public class SucursalProvidersController {

    private final EmployeeRepository employeeRepo;
    private final SucursalRepository sucursalRepo;
    private final ProviderRepository providerRepo;
    private final ProviderBranchRepository providerBranchRepo;

    public SucursalProvidersController(
            EmployeeRepository employeeRepo,
            SucursalRepository sucursalRepo,
            ProviderRepository providerRepo,
            ProviderBranchRepository providerBranchRepo
    ) {
        this.employeeRepo = employeeRepo;
        this.sucursalRepo = sucursalRepo;
        this.providerRepo = providerRepo;
        this.providerBranchRepo = providerBranchRepo;
    }

    /** Validación multi-tenant + roles (mismo patrón que inventario/ventas/devoluciones) */
    private Sucursal validateAccess(Long clientId, Long sucursalId, Authentication auth) {
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Empleado no encontrado"));

        Sucursal suc = sucursalRepo.findById(sucursalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada"));

        if (suc.getClient() == null || !suc.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("La sucursal no pertenece al cliente");
        }

        boolean propietario = emp.getRole() == EmployeeRole.PROPIETARIO;
        if (!propietario) {
            if (emp.getSucursal() == null || !emp.getSucursal().getId().equals(sucursalId)) {
                throw new AccessDeniedException("No autorizado para esta sucursal");
            }
        }
        return suc;
    }

    /* ------------------------------------------------------------
     * GET /providers  → Lista proveedores vinculados a la sucursal
     * ------------------------------------------------------------ */
    @GetMapping
    public ResponseEntity<List<ProviderDto>> list(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            Authentication auth
    ) {
        validateAccess(clientId, sucursalId, auth);

        List<ProviderDto> result = providerBranchRepo.findBySucursalId(sucursalId).stream()
                .filter(ProviderBranch::isActive) // solo vínculos activos
                .map(pb -> toDto(pb.getProvider()))
                .toList();

        return ResponseEntity.ok(result);
    }

    /* -----------------------------------------------------------------------
     * POST /providers/{providerId}  → Vincula un proveedor existente a sucursal
     * ----------------------------------------------------------------------- */
    @PostMapping("/{providerId}")
    public ResponseEntity<Void> link(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long providerId,
            Authentication auth
    ) {
        Sucursal suc = validateAccess(clientId, sucursalId, auth);

        Provider provider = providerRepo.findById(providerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proveedor no encontrado"));

        // Seguridad: el proveedor debe pertenecer al mismo cliente
        if (provider.getClient() == null || !provider.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("Proveedor no pertenece al cliente");
        }

        if (!providerBranchRepo.existsByProviderIdAndSucursalId(providerId, sucursalId)) {
            ProviderBranch link = new ProviderBranch();
            link.setProvider(provider);
            link.setSucursal(suc);
            link.setActive(true);
            providerBranchRepo.save(link);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        }

        // Ya existía el vínculo → 204 idempotente
        return ResponseEntity.noContent().build();
    }

    /* -----------------------------------------------------------------------
     * DELETE /providers/{providerId}  → Desvincula proveedor de la sucursal
     * ----------------------------------------------------------------------- */
    @DeleteMapping("/{providerId}")
    public ResponseEntity<Void> unlink(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long providerId,
            Authentication auth
    ) {
        validateAccess(clientId, sucursalId, auth);

        // Si no existe, deleteBy... no falla; comportamiento idempotente
        providerBranchRepo.deleteByProviderIdAndSucursalId(providerId, sucursalId);
        return ResponseEntity.noContent().build();
    }

    /* Mapper simple */
    private ProviderDto toDto(Provider p) {
        if (p == null) return null;
        ProviderDto dto = new ProviderDto();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setAddress(p.getAddress());
        return dto;
    }
}
