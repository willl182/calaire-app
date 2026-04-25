### Evaluación Tipo A de la Incertidumbre (Repetibilidad de la Medición)

Para cada nivel de concentración, se debe evaluar la incertidumbre estándar debida a la repetibilidad de las mediciones basándose en las $n=3$ lecturas promedio reportadas. Este cálculo corresponde a una Evaluación Tipo A de la incertidumbre según la Guía GUM (ISO/IEC Guide 98-3).

**Paso 1: Cálculo de la media aritmética ($\bar{x}$)**
Calcule el promedio de las $n=3$ mediciones independientes. Esta será la mejor estimación del valor de concentración para esa corrida:
$$\bar{x} = \frac{1}{3} \sum_{k=1}^{3} x_k$$

**Paso 2: Cálculo de la desviación estándar experimental ($s$)**
Calcule la desviación estándar de las $n=3$ mediciones para cuantificar la dispersión de los datos:
$$s = \sqrt{\frac{\sum_{k=1}^{3} (x_k - \bar{x})^2}{3-1}}$$

**Paso 3: Cálculo de la incertidumbre estándar de la media ($u(\bar{x})$)**
La incertidumbre asociada al valor promedio estimado se define como la desviación estándar experimental de la media. Dado que el protocolo exige reportar exactamente $n=3$ mediciones, la incertidumbre estándar por repetibilidad se calcula dividiendo $s$ entre $\sqrt{3}$:
$$u(\bar{x}) = \frac{s}{\sqrt{3}}$$
*(Nota conceptual: El divisor $\sqrt{3}$ proviene estrictamente de $\sqrt{n}$ para una Evaluación Tipo A con 3 datos, y no debe confundirse con el modelado de una distribución rectangular utilizada en evaluaciones Tipo B).*

**Paso 4: Integración a la incertidumbre combinada ($u_c$)**
El valor obtenido de $u(\bar{x})$ representa exclusivamente la incertidumbre por repetibilidad. Este componente debe combinarse en cuadratura (suma de varianzas) con las demás fuentes de incertidumbre evaluadas (por ejemplo, incertidumbre del cilindro patrón, calibración del instrumento, derivas, etc.) para determinar la incertidumbre estándar combinada final ($u_c$) del resultado.
