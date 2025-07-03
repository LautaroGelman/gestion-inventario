package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.CreateEmployeeRequest;
import grupo5.gestion_inventario.clientpanel.dto.EmployeeDto;
import grupo5.gestion_inventario.clientpanel.dto.UpdateEmployeeRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.ClientRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepo;
    private final ClientRepository   clientRepo;
    private final PasswordEncoder    passwordEncoder;

    public EmployeeService(EmployeeRepository employeeRepo,
                           ClientRepository clientRepo,
                           PasswordEncoder passwordEncoder) {
        this.employeeRepo    = employeeRepo;
        this.clientRepo      = clientRepo;
        this.passwordEncoder = passwordEncoder;
    }

    /* --------- CONSULTAS --------- */

    public List<EmployeeDto> findByClientId(Long clientId) {
        return employeeRepo.findByClientId(clientId).stream()
                .map(EmployeeDto::fromEntity)
                .collect(Collectors.toList());
    }

    /* --------- CREAR --------- */

    @Transactional
    public EmployeeDto create(Long clientId, CreateEmployeeRequest req) {
        if (employeeRepo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email ya usado");
        }

        Client client = clientRepo.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        String encodedPassword = passwordEncoder.encode(req.getPassword());

        Employee e = new Employee(
                req.getName(),
                req.getEmail(),
                encodedPassword,
                req.getRole(),
                client
        );

        Employee saved = employeeRepo.save(e);
        return EmployeeDto.fromEntity(saved);
    }

    /* --------- ACTUALIZAR --------- */

    @Transactional
    public EmployeeDto update(Long clientId, Long id, UpdateEmployeeRequest req) {
        Employee e = employeeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        if (!e.getClient().getId().equals(clientId)) {
            throw new RuntimeException("No autorizado");
        }

        // Nombre y rol
        if (req.getName() != null) {
            e.setName(req.getName());
        }
        if (req.getRole() != null) {
            e.setRole(req.getRole());
        }

        // Contraseña nueva (texto plano en passwordHash)
        if (req.getPasswordHash() != null && !req.getPasswordHash().isBlank()) {
            e.setPasswordHash(passwordEncoder.encode(req.getPasswordHash()));
        }

        Employee saved = employeeRepo.save(e);
        return EmployeeDto.fromEntity(saved);
    }

    /* --------- ELIMINAR --------- */

    @Transactional
    public void delete(Long clientId, Long id) {
        Employee e = employeeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        if (!e.getClient().getId().equals(clientId)) {
            throw new RuntimeException("No autorizado");
        }
        employeeRepo.delete(e);
    }
}
