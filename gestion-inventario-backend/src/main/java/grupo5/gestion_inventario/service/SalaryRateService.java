package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.model.SalaryRate;
import grupo5.gestion_inventario.clientpanel.repository.SalaryRateRepository;
import java.math.BigDecimal;
import java.time.LocalDate;

import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SalaryRateService {

    private final SalaryRateRepository rateRepo;
    private final EmployeeRepository employeeRepo;

    @Transactional
    public SalaryRate setHourlyRate(Long employeeId, BigDecimal rate, LocalDate effectiveFrom) {
        Employee emp = employeeRepo.getReferenceById(employeeId);

        SalaryRate sr = new SalaryRate();
        sr.setEmployee(emp);
        sr.setHourlyRate(rate);
        sr.setEffectiveFrom(effectiveFrom == null ? LocalDate.now() : effectiveFrom);

        return rateRepo.save(sr);
    }

    public BigDecimal findLatestRate(Long employeeId, LocalDate cutOff) {
        return rateRepo.findTopByEmployeeIdAndDate(employeeId, cutOff)
                .map(SalaryRate::getHourlyRate)
                .orElse(null);
    }
}
