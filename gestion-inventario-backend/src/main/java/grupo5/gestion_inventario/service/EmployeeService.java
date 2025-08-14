// backend/src/main/java/grupo5/gestion_inventario/service/EmployeeService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.CreateEmployeeRequest;
import grupo5.gestion_inventario.clientpanel.dto.EmployeeDto;
import grupo5.gestion_inventario.clientpanel.dto.UpdateEmployeeRequest;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepo;
    private final ClientRepository   clientRepo;
    private final SucursalRepository sucursalRepo;
    private final PasswordEncoder    passwordEncoder;

    public EmployeeService(EmployeeRepository employeeRepo,
                           ClientRepository   clientRepo,
                           SucursalRepository sucursalRepo,
                           PasswordEncoder    passwordEncoder) {
        this.employeeRepo    = employeeRepo;
        this.clientRepo      = clientRepo;
        this.sucursalRepo    = sucursalRepo;
        this.passwordEncoder = passwordEncoder;
    }

    /* ============================================================
     *  CONSULTAS
     * ============================================================ */
    public List<EmployeeDto> findBySucursalId(Long sucursalId) {
        return employeeRepo.findBySucursalId(sucursalId).stream()
                .map(EmployeeDto::fromEntity)
                .collect(Collectors.toList());
    }

    /* ============================================================
     *  CREAR EMPLEADO (excepto PROPIETARIO, que se auto-crea)
     * ============================================================ */
    @Transactional
    public EmployeeDto create(Long clientId,
                              Long sucursalId,
                              CreateEmployeeRequest req) {

        if (employeeRepo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email ya usado");
        }

        Client client = clientRepo.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));

        if (!sucursal.getClient().getId().equals(clientId)) {
            throw new RuntimeException("La sucursal no pertenece al cliente");
        }

        /* PROPIETARIO solo puede existir uno y no se asigna a sucursal */
        if (req.getRole() == EmployeeRole.PROPIETARIO) {
            throw new RuntimeException("No puedes crear otro PROPIETARIO");
        }

        String hash = passwordEncoder.encode(req.getPassword());

        Employee emp = new Employee(
                req.getName(),
                req.getEmail(),
                hash,
                req.getRole(),
                client,
                sucursal          // ← asignación de sucursal
        );

        return EmployeeDto.fromEntity(employeeRepo.save(emp));
    }

    /* ============================================================
     *  ACTUALIZAR EMPLEADO
     * ============================================================ */
    @Transactional
    public EmployeeDto update(Long clientId,
                              Long sucursalId,
                              Long employeeId,
                              UpdateEmployeeRequest req) {

        Employee emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        if (!emp.getClient().getId().equals(clientId)) {
            throw new RuntimeException("No autorizado");
        }

        if (req.getName() != null) emp.setName(req.getName());
        if (req.getRole() != null) emp.setRole(req.getRole());

        if (req.getPasswordHash() != null && !req.getPasswordHash().isBlank()) {
            emp.setPasswordHash(passwordEncoder.encode(req.getPasswordHash()));
        }

        /* Cambio de sucursal (opcional) */
        if (req.getSucursalId() != null) {
            Sucursal nueva = sucursalRepo.findById(req.getSucursalId())
                    .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));
            if (!nueva.getClient().getId().equals(clientId)) {
                throw new RuntimeException("Sucursal no pertenece al cliente");
            }
            emp.setSucursal(nueva);
        }

        return EmployeeDto.fromEntity(employeeRepo.save(emp));
    }

    /* ============================================================
     *  ELIMINAR EMPLEADO
     * ============================================================ */
    @Transactional
    public void delete(Long clientId, Long employeeId) {

        Employee emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        if (!emp.getClient().getId().equals(clientId)) {
            throw new RuntimeException("No autorizado");
        }
        if (emp.getRole() == EmployeeRole.PROPIETARIO) {
            throw new RuntimeException("No puedes eliminar al PROPIETARIO");
        }
        employeeRepo.delete(emp);
    }

    /* ============================================================
     *  LEGACY (pre-sucursal) — mantenido como comentario
     * ============================================================
     * public List<EmployeeDto> findByClientId(Long clientId) { … }
     * public EmployeeDto create(Long clientId, CreateEmployeeRequest req) { … }
     * public EmployeeDto update(Long clientId, Long id, UpdateEmployeeRequest req) { … }
     * public void delete(Long clientId, Long id) { … }
     */
}
