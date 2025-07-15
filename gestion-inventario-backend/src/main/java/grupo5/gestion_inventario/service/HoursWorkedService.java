// src/main/java/grupo5/gestion_inventario/service/HoursWorkedService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.model.HoursWorked;
import grupo5.gestion_inventario.clientpanel.repository.HoursWorkedRepository;
import java.math.BigDecimal;

import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HoursWorkedService {

    private final HoursWorkedRepository hoursRepo;
    private final EmployeeRepository employeeRepo;

    /**
     * Registra o actualiza el total de horas trabajadas por mes para un empleado.
     *
     * @param employeeId ID del empleado
     * @param year       Año (e.g., 2025)
     * @param month      Mes (1-12)
     * @param hours      Total de horas trabajadas en el mes
     * @return la entidad HoursWorked persistida
     */
    @Transactional
    public HoursWorked recordHours(Long employeeId, int year, int month, BigDecimal hours) {
        // Obtiene referencia al empleado (no dispara consulta completa)
        Employee emp = employeeRepo.getReferenceById(employeeId);

        // Busca registro existente o crea uno nuevo
        HoursWorked hw = hoursRepo
                .findByEmployeeIdAndYearAndMonth(employeeId, year, month)
                .orElseGet(HoursWorked::new);

        hw.setEmployee(emp);
        hw.setYear(year);
        hw.setMonth(month);
        hw.setHours(hours);

        return hoursRepo.save(hw);
    }
}
