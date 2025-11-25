using System;

// Trida Kruh demonstruje praci s jednou hodnotou (polomer) a metodami okolo ni.
class Kruh
{
    private double polomer;

    // Konstruktor nastavi polomer na 1, pokud nic nezadame.
    public Kruh() : this(1) { }

    // Konstruktor, kteremu polomer predame.
    public Kruh(double pocatecniPolomer)
    {
        NastavPolomer(pocatecniPolomer);
    }

    // Metoda pro zmenu polomeru (kontroluje, ze je cislo kladne).
    public void NastavPolomer(double novyPolomer)
    {
        if (novyPolomer <= 0)
        {
            throw new ArgumentException("Polomer musi byt kladne cislo.");
        }

        polomer = novyPolomer;
    }

    // Metoda, ktera vraci aktualni polomer.
    public double DejPolomer() => polomer;

    // Metoda, ktera vraci prumer kruhu.
    public double DejPrumer() => polomer * 2;

    // Vypocet obvodu kruhu.
    public double Obvod() => 2 * Math.PI * polomer;

    // Vypocet obsahu kruhu.
    public double Obsah() => Math.PI * polomer * polomer;
}

// Trida Postava drzi jednoduche RPG statistiky a umi utocit, lecit se a kouzlit.
class Postava
{
    private static readonly Random Nahoda = new Random();

    public string jmeno;
    public int sila;
    public int obratnost;
    private int pocet_zivotu;
    public int magie;

    public Postava(string jmeno, int sila, int obratnost, int pocetZivotu, int magie)
    {
        this.jmeno = jmeno;
        this.sila = sila;
        this.obratnost = obratnost;
        pocet_zivotu = pocetZivotu;
        this.magie = magie;
    }

    // Vraci, zda postava jeste zije.
    public bool JeNazivu() => pocet_zivotu > 0;

    // Jednoduchy uder mecem nebo zbrani zblizka.
    public void Bojuj(Postava cil)
    {
        if (!JeNazivu())
        {
            Console.WriteLine($"{jmeno} uz nemuze bojovat.");
            return;
        }

        int utok = sila + Nahoda.Next(0, obratnost + 1);
        Console.WriteLine($"{jmeno} utoci na {cil.jmeno} a udeluje {utok} poskozeni.");
        cil.UtrpZraneni(utok);
    }

    // Zakladni kouzlo, ktere spotrebuje magii a udeli vyssi poskozeni.
    public void Kouzlo(Postava cil)
    {
        if (!JeNazivu())
        {
            Console.WriteLine($"{jmeno} je vyradeny a nemuze kouzlit.");
            return;
        }

        const int cenaKouzla = 2;

        if (magie < cenaKouzla)
        {
            Console.WriteLine($"{jmeno} nema dost magicke energie.");
            return;
        }

        magie -= cenaKouzla;
        int silaKouzla = sila + 5 + Nahoda.Next(0, obratnost + 1);
        Console.WriteLine($"{jmeno} sesila kouzlo na {cil.jmeno} a udeluje {silaKouzla} poskozeni (magie zbyva {magie}).");
        cil.UtrpZraneni(silaKouzla);
    }

    // Jednoduche leceni zvysi pocet zivotu.
    public void Leceni(int hodnota)
    {
        if (!JeNazivu())
        {
            Console.WriteLine($"{jmeno} je vyradeny a nelze ho lecit.");
            return;
        }

        if (hodnota <= 0)
        {
            Console.WriteLine("Leceni musi byt kladna hodnota.");
            return;
        }

        pocet_zivotu += hodnota;
        Console.WriteLine($"{jmeno} se leci o {hodnota} bodu a ma {pocet_zivotu} zivotu.");
    }

    // Pomocna metoda pro zapsani zraneni.
    private void UtrpZraneni(int hodnota)
    {
        pocet_zivotu -= hodnota;
        if (pocet_zivotu < 0)
        {
            pocet_zivotu = 0;
        }

        Console.WriteLine($"{jmeno} ma aktualne {pocet_zivotu} zivotu.");
    }
}

class Program
{
    static void Main()
    {
        bool pokracovat = true;

        while (pokracovat)
        {
            Console.WriteLine("\n=========================================");
            Console.WriteLine("Vyberte, kterou ukazku chcete spustit:");
            Console.WriteLine("1 - Prace s tridou Kruh");
            Console.WriteLine("2 - Postavy a jednoducha hra");
            Console.WriteLine("0 - Konec programu");
            Console.Write("Vase volba: ");

            string? volba = Console.ReadLine();
            switch (volba)
            {
                case "1":
                    SpustKruhDemo();
                    break;
                case "2":
                    SpustPostavyDemo();
                    break;
                case "0":
                    pokracovat = false;
                    break;
                default:
                    Console.WriteLine("Neplatna volba, zkuste to znovu.");
                    break;
            }
        }

        Console.WriteLine("Program byl ukoncen. Diky za vyzkouseni!");
    }

    // Ukazka prace s kruhem - polomer, prumer, obvod a obsah.
    static void SpustKruhDemo()
    {
        Console.WriteLine("\n--- Ukazka tridy Kruh ---");
        Kruh kruhDefault = new Kruh(); // polomer 1
        Console.WriteLine($"Vychozi polomer: {kruhDefault.DejPolomer()}");
        Console.WriteLine($"Prumer: {kruhDefault.DejPrumer():F2}");
        Console.WriteLine($"Obvod: {kruhDefault.Obvod():F2}");
        Console.WriteLine($"Obsah: {kruhDefault.Obsah():F2}");

        Kruh kruhVetsi = new Kruh(3.5);
        Console.WriteLine("\nNastavime novy kruh s polomerem 3.5:");
        Console.WriteLine($"Polomer: {kruhVetsi.DejPolomer()}");
        Console.WriteLine($"Prumer: {kruhVetsi.DejPrumer():F2}");
        Console.WriteLine($"Obvod: {kruhVetsi.Obvod():F2}");
        Console.WriteLine($"Obsah: {kruhVetsi.Obsah():F2}");
    }

    // Ukazka vytvoreni nekolika postav a jejich souboje.
    static void SpustPostavyDemo()
    {
        Console.WriteLine("\n--- Ukazka tridy Postava ---");
        Postava bojovnik = new Postava("Bojovnik", sila: 7, obratnost: 4, pocetZivotu: 60, magie: 2);
        Postava kouzelnik = new Postava("Kouzelnik", sila: 3, obratnost: 6, pocetZivotu: 40, magie: 12);
        Postava zombi = new Postava("Zombi", sila: 5, obratnost: 2, pocetZivotu: 55, magie: 0);
        Postava lucistnik = new Postava("Lucistnik", sila: 4, obratnost: 7, pocetZivotu: 45, magie: 3);

        Console.WriteLine("\n=> Bojovnik utoci na zombii:");
        bojovnik.Bojuj(zombi);

        Console.WriteLine("\n=> Kouzelnik sesila kouzlo na zombii:");
        kouzelnik.Kouzlo(zombi);

        Console.WriteLine("\n=> Zombi se snazi zautocit na kouzelnika:");
        zombi.Bojuj(kouzelnik);

        Console.WriteLine("\n=> Lucistnik se leci, aby byl pripraven na boj:");
        lucistnik.Leceni(10);

        Console.WriteLine("\n--- Simulace maleho souboje ---");
        Postava arenaBojovnik = new Postava("Bojovnik", 7, 4, 60, 2);
        Postava arenaZombi = new Postava("Zombi", 5, 2, 55, 0);
        SimulujBoj(arenaBojovnik, arenaZombi);
    }

    // Souboj pokracuje, dokud nekdo neklesne na nulu zivotu.
    static void SimulujBoj(Postava prvni, Postava druha)
    {
        int kolo = 1;
        while (prvni.JeNazivu() && druha.JeNazivu())
        {
            Console.WriteLine($"\nKolo {kolo}");
            prvni.Bojuj(druha);
            if (!druha.JeNazivu())
            {
                Console.WriteLine($"{druha.jmeno} pada k zemi!");
                break;
            }

            // V kazdem druhem kole se druha postava pokusi seslat kouzlo, jinak utoci.
            if (kolo % 2 == 0)
            {
                druha.Kouzlo(prvni);
            }
            else
            {
                druha.Bojuj(prvni);
            }

            if (!prvni.JeNazivu())
            {
                Console.WriteLine($"{prvni.jmeno} pada k zemi!");
                break;
            }

            kolo++;
        }

        string viteze = prvni.JeNazivu() ? prvni.jmeno : druha.jmeno;
        Console.WriteLine($"\nVitezem souboje je: {viteze}");
    }
}
