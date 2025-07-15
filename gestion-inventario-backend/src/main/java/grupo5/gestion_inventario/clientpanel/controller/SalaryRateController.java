package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.model.SalaryRate;
import grupo5.gestion_inventario.service.SalaryRateService;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employees/{employeeId}/salary-rate")
@RequiredArgsConstructor
public class SalaryRateController {

    private final SalaryRateService rateSvc;

    /** Record que usamos para la petición */
    public record SalaryRateRequest(BigDecimal hourlyRate,
                                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                    LocalDate effectiveFrom) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SalaryRate setRate(@PathVariable Long employeeId,
                              @RequestBody SalaryRateRequest body) {
        return rateSvc.setHourlyRate(
                employeeId,
                body.hourlyRate(),
                body.effectiveFrom());
    }
}
