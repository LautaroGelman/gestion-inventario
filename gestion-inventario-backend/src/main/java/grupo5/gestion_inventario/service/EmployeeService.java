// src/main/java/grupo5/gestion_inventario/service/EmployeeService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.CreateEmployeeRequest;
import grupo5.gestion_inventario.clientpanel.dto.EmployeeDto;
import grupo5.gestion_inventario.clientpanel.dto.UpdateEmployeeRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.ClientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepo;
    private final ClientRepository clientRepo;

    public EmployeeService(EmployeeRepository employeeRepo, ClientRepository clientRepo) {
        this.employeeRepo = employeeRepo;
        this.clientRepo   = clientRepo;
    }

    public List<EmployeeDto> findByClientId(Long clientId) {
        return employeeRepo.findAll().stream()
                .filter(e -> e.getClient().getId().equals(clientId))
                .map(EmployeeDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmployeeDto create(Long clientId, CreateEmployeeRequest req) {
        Client client = clientRepo.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        Employee e = new Employee(
                req.getName(), req.getEmail(),
                req.getPasswordHash(), req.getRole(), client
        );
        Employee saved = employeeRepo.save(e);
        return EmployeeDto.fromEntity(saved);
    }

    @Transactional
    public EmployeeDto update(Long clientId, Long id, UpdateEmployeeRequest req) {
        Employee e = employeeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        if (!e.getClient().getId().equals(clientId)) {
            throw new RuntimeException("No autorizado");
        }
        e.setName(req.getName());
        e.setRole(req.getRole());
        // Opcional: cambiar contraseña si viene en req
        if (req.getPasswordHash() != null) {
            e.setPasswordHash(req.getPasswordHash());
        }
        Employee saved = employeeRepo.save(e);
        return EmployeeDto.fromEntity(saved);
    }

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
